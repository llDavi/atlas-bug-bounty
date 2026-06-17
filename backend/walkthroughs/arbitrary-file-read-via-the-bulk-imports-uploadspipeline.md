---
title: "Arbitrary file read  via the bulk imports UploadsPipeline"
slug: "arbitrary-file-read-via-the-bulk-imports-uploadspipeline"
platform: "hackerone"
vuln_class: "Path Traversal"
difficulty: "hard"
scope_type: "web"
bounty: 29000
program: "GitLab"
reporter: "vakzz"
published_at: "2022-03-21"
source_url: "https://hackerone.com/reports/1439593"
tags: []
teaser: "A mishandled file path in the bulk import pipeline let attackers read any server file by smuggling directory traversal sequences through upload metadata."
---

## The Program

GitLab is one of the most widely deployed DevOps platforms in the world, serving millions of developers and enterprises with source code management, CI/CD pipelines, issue tracking, and collaboration tooling. Its self-hosted and SaaS variants both run the same codebase, meaning a vulnerability discovered on gitlab.com has direct implications for every self-managed installation worldwide. The bug bounty program is well-regarded in the security community for paying competitive bounties, triaging quickly, and disclosing reports publicly after fixes land — making it an excellent program for researchers who want to build a public track record.

The group import feature — part of GitLab's "bulk imports" system introduced around GitLab 14.x — was designed to let administrators migrate entire groups, including their milestones, wikis, labels, and file uploads, between GitLab instances. Because this feature involves downloading a remote tar archive and extracting it server-side, it represents exactly the kind of complex, multi-step pipeline where subtle security assumptions can break down.

What made this attack surface particularly notable was the combination of two facts: the pipeline decompresses a user-influenced archive on the server, and the code that processes the extracted files does almost nothing to validate what was unpacked. Any feature that accepts a compressed archive from an attacker-controlled server and then opens files from it deserves careful scrutiny — the archive format itself has decades of well-documented abuse vectors.

---

## The Recon

Reconnaissance began by tracing the bulk imports code path in GitLab's public source repository. GitLab develops in the open, so the entire Rails codebase is browsable on gitlab.com itself. Searching for the `UploadsPipeline` class leads directly to `lib/bulk_imports/common/pipelines/uploads_pipeline.rb`. Reading through the `extract` method reveals the exact sequence: a remote `uploads.tar.gz` is downloaded via a `download_service`, then passed to `untar_zxf`, and the resulting file paths are enumerated with `Dir.glob`.

The next step was examining what `untar_zxf` actually does. Searching the codebase for that method shows it is a thin wrapper around a system `tar` call. Critically, the implementation only adjusts file permissions — it does not strip symlinks, does not check extracted path components for traversal sequences, and does not validate the type of each extracted filesystem object. This is a meaningful omission: the `tar` format natively supports symbolic links, and `tar` will faithfully recreate them on extraction unless explicitly told not to.

Attention then shifted to the `load` method in the same file. After extraction, each path returned by `Dir.glob` is passed individually to `load`. The method calls `File.open(file_path, 'r')` and hands the resulting IO object to `UploadService`, which stores it as a new upload attached to the destination group. The key detail: `File.open` follows symbolic links by default. If a symlink pointing to `/etc/passwd` appears among the extracted paths, `File.open` will transparently open the real file at that target path, not the symlink itself.

The final piece of recon was understanding the upload path structure. When a file is uploaded to a GitLab milestone description, the server stores it under a directory named after a 32-character hex secret — for example, `uploads/d3209c811fee407218bff7cb3b4333e6/filename`. That directory name must appear in the crafted archive so that the `extract_dynamic_path` method recognizes the path as a valid upload and does not skip it. The secret is visible in the URL of any attachment uploaded to the group being imported from, and since the attacker controls the source group, obtaining it is trivial.

---

## The "Wait a Second..." Moment

The realization crystallized when reading two consecutive lines in `uploads_pipeline.rb`. The `extract` method calls `untar_zxf` and then immediately passes every resulting path — without any filtering — into `BulkImports::Pipeline::ExtractedData`. Scrolling down to `load`, the code checks whether the path is a directory and skips it, but there is no equivalent check for symbolic links. The condition `return if File.directory?(file_path)` would return `false` for a symlink (since `File.directory?` on a symlink checks the symlink target type, not the symlink itself), meaning a symlink pointing to a regular file passes straight through to `File.open`.

What made this particularly alarming was the target of that `File.open` call: the contents get handed to `UploadService`, which stores them as a new publicly accessible file attachment inside the destination group on gitlab.com. An attacker does not need out-of-band exfiltration, a callback server for file contents, or any unusual privileges. The server reads the sensitive file and then helpfully serves it back through the normal GitLab uploads endpoint — a clean, authenticated HTTP GET away.

---

## The Exploit

**Step 1 — Set up the source group.** Create a group on the source GitLab instance (gitlab.com works). Inside the group, create a milestone and upload any file as an attachment in the milestone description. After uploading, note the 32-character hex hash embedded in the attachment URL — this is the upload secret, e.g., `d3209c811fee407218bff7cb3b4333e6`.

**Step 2 — Craft the malicious archive.** On a local Linux machine, create a directory whose name matches the upload secret, then place symbolic links inside it pointing to target files on the GitLab server:

```bash
mkdir ./d3209c811fee407218bff7cb3b4333e6
ln -s /etc/passwd ./d3209c811fee407218bff7cb3b4333e6/passwd
ln -s /srv/gitlab/config/secrets.yml ./d3209c811fee407218bff7cb3b4333e6/secrets.yml
tar cvzf uploads.tar.gz ./d3209c811fee407218bff7cb3b4333e6
```

The resulting `uploads.tar.gz` contains no actual file data — only two symbolic links. When `tar` extracts this archive on the server, it recreates the symlinks in the temporary directory.

**Step 3 — Intercept the download with a proxy server.** The bulk imports pipeline fetches `uploads.tar.gz` from the source GitLab instance using an API token. A small Flask proxy (`api.py`, attached to the original report) intercepts this request and substitutes the crafted malicious archive in place of the legitimate one. Run the proxy locally:

```bash
FLASK_APP=api.py flask run
```

Then expose it to the internet using ngrok:

```bash
ngrok http 5000
```

The ngrok URL becomes the "source GitLab instance" URL entered during import.

**Step 4 — Trigger the import.** Generate a personal access token on the real GitLab account (Settings → Access Tokens). Navigate to the destination group creation page, select "Import group," enter the ngrok URL as the source instance, and provide the access token. Select the source group and assign a new name. GitLab's bulk import worker will then fetch the malicious `uploads.tar.gz` through the proxy, extract it server-side, follow the symlinks, and upload the contents of `/etc/passwd` and `secrets.yml` as ordinary file attachments.

**Step 5 — Retrieve the exfiltrated files.** After the import completes, open the imported group's milestone. The uploaded attachments are listed. The URL pattern follows the standard GitLab uploads path:

```
https://gitlab.com/groups/<new-group>/-/uploads/d3209c811fee407218bff7cb3b4333e6/passwd
https://gitlab.com/groups/<new-group>/-/uploads/d3209c811fee407218bff7cb3b4333e6/secrets.yml
```

A direct GET request to either URL returns the raw content of the server-side file, including production secret keys.

---

## The Report

A strong report for this vulnerability leads with a precise, unambiguous title that conveys both the primitive and the trigger: "Arbitrary File Read via Symlink in Bulk Imports UploadsPipeline" immediately tells a triager what class of vulnerability this is and where to look in the code. Avoid vague titles like "file upload issue" — specificity signals researcher credibility.

The severity justification should reference the concrete impact rather than leaning entirely on CVSS math. In this case, the impact is direct: an authenticated attacker with standard group-creation privileges can read `secrets.yml`, which contains `secret_key_base`, `otp_key_base`, and private keys used to sign JWTs and CI tokens. Compromise of these values is equivalent to full application compromise — session forgery, credential decryption, and token signing are all possible. The CVSS score of 9.6 (Critical) is defensible because the attack is network-reachable, requires no special privileges beyond a normal GitLab account, and has no user interaction requirement beyond the attacker initiating the import.

Reproduction steps should be written so that a GitLab engineer who has never heard of the bug can follow them exactly and reproduce the result in under an hour. Include the exact bash commands for crafting the archive, a link to the proxy script, and specific URLs demonstrating successful exfiltration. Attaching screenshots of `/etc/passwd` and a redacted portion of `secrets.yml` provides irrefutable proof without requiring the triager to run the exploit themselves. Highlighting the specific lines of vulnerable code (`uploads_pipeline.rb#L15` and `#L23`) and comparing against the existing mitigation in the project import pipeline (which does strip symlinks) makes the fix path obvious and accelerates resolution.

---

## The Takeaway

The core insight is this: any server-side pipeline that extracts a tar archive without explicitly stripping symbolic links before processing the extracted paths is vulnerable to arbitrary file read, because `tar` preserves symlinks by default and most file-reading APIs follow them transparently.

Similar patterns appear anywhere a web application decompresses user-influenced archives: ZIP file extraction (the analogous "Zip Slip" class), import/export features in project management tools, backup restoration endpoints, and package manager integrations. The search strategy is to find features that accept compressed archives from a source the attacker influences, then trace the extraction code to see whether symlinks, path traversal sequences (`../`), and absolute paths are all sanitized before any file operation occurs.

Tools that accelerate this research include public source repositories (GitLab, GitHub, and many enterprise tools develop in the open), `grep` or `ripgrep` for patterns like `tar`, `unzip`, `Dir.glob`, and `File.open` in proximity to one another, and a local Docker instance of the target application for safe end-to-end verification. The fix to look for — and to suggest in a report — is explicit symlink removal after extraction (e.g., `find tmp_dir -type l -delete`) or using extraction flags that refuse to create symlinks, combined with path canonicalization to ensure no extracted path escapes the target directory.
