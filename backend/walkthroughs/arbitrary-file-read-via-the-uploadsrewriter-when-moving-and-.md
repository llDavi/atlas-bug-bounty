---
title: "Arbitrary file read via the UploadsRewriter when moving and issue"
slug: "arbitrary-file-read-via-the-uploadsrewriter-when-moving-and-"
platform: "hackerone"
vuln_class: "Path Traversal"
difficulty: "hard"
scope_type: "web"
bounty: 20000
program: "GitLab"
reporter: "vakzz"
published_at: "2020-04-27"
source_url: "https://hackerone.com/reports/827052"
tags: []
teaser: "A path traversal flaw in the upload rewriter turned a routine issue move into an arbitrary file read primitive."
---

## The Program

GitLab is one of the most widely deployed DevOps platforms in the world, offering source control, CI/CD pipelines, issue tracking, and project management either as a cloud-hosted service or as a self-managed instance. Because GitLab is trusted by enterprises, governments, and open-source projects to store sensitive source code and infrastructure secrets, its attack surface carries exceptional weight — a vulnerability on a self-managed GitLab instance can cascade into a full compromise of an organization's entire software supply chain.

GitLab runs a public bug bounty program on HackerOne with generous payouts, particularly for vulnerabilities affecting the self-managed ("Your Own GitLab Instance") asset category. This category is notable because self-managed instances run on the attacker's own infrastructure for testing purposes, lowering the barrier to deep, server-side exploration. Researchers can spin up a full GitLab environment and probe internal behavior that would otherwise require blind exploitation on a production system.

The issue management and project migration subsystems are particularly fertile ground for research. These features involve server-side file operations — copying attachments, rewriting markdown references, and moving data between database namespaces — all of which interact with the filesystem. Any feature that translates user-controlled input into a filesystem path is a candidate for path traversal, and GitLab's upload and rewriting infrastructure sits squarely in that category.

---

## The Recon

The entry point for this vulnerability is GitLab's issue upload and migration workflow. When a user uploads an image or file attachment to a GitLab issue, the platform stores it under a URL path structured as `/uploads/<32-character-hex-secret>/<filename>`. This pattern is embedded directly in the markdown body of the issue description, for example: `![alt text](/uploads/abcdef1234.../image.png)`. This URL structure is publicly visible in any issue body and immediately signals that GitLab maintains a mapping between a random secret token and a file on disk.

The next area of interest is the "Move Issue" feature, accessible from any issue's sidebar. When an issue is moved to a different project, GitLab does not simply update a database record — it also copies all embedded file attachments to the destination project's upload directory. This is handled by the `UploadsRewriter` class in the Rails backend. The rewriter scans the issue description using a regular expression to find embedded upload references, then retrieves and copies each referenced file to the new project's storage location.

Examining the regex pattern used by `UploadsRewriter` reveals the critical detail:

```
MARKDOWN_PATTERN = %r{\!?\[.*?\]\(/uploads/(?<secret>[0-9a-f]{32})/(?<file>.*?)\)}.freeze
```

The named capture group `(?<file>.*?)` accepts any sequence of characters for the filename segment. There is no allowlist, no extension check, and no path normalization applied to the captured value before it is passed to `find_file`. Mapping out the call chain — `gsub` → `find_file` → `FileUploader.new` → `retrieve_from_store!` → `copy_to` — confirms that the raw, user-controlled string flows directly into filesystem operations without sanitization.

---

## The "Wait a Second..." Moment

The inflection point arrives when the regex capture group `(?<file>.*?)` is read carefully alongside the `find_file` implementation. The uploader constructs a path by joining the project's upload directory, the 32-character secret subdirectory, and the raw `file` value. Because `file` is never validated and directory traversal sequences (`../`) are not stripped, the constructed path can escape the intended upload directory entirely. A `file` value of `../../../../../../../../../../../../../../etc/passwd` would resolve to the root filesystem, not to any upload subdirectory.

What makes this particularly significant is the copy behavior. The vulnerability does not require reading a file directly over HTTP — instead, the file is silently copied into the destination project's upload directory as part of the issue move operation. Once copied, it becomes accessible via a normal, authenticated (or even unauthenticated, depending on project visibility) upload URL. The attacker does not need to trigger any error or observe server responses during exploitation; the exfiltration happens as a side effect of an ordinary project management action.

---

## The Exploit

Exploitation requires two GitLab projects within the same instance and an account with at least Reporter access to both. The steps are as follows.

**Step 1 — Create two projects.** Any two accessible projects work. The source project is where the malicious issue will be created; the destination project is where the file will be copied.

**Step 2 — Create an issue with a traversal payload in the description.** In the source project, open a new issue and set the description to:

```markdown
![a](/uploads/11111111111111111111111111111111/../../../../../../../../../../../../../../etc/passwd)
```

The 32-character hex string (`111...1`) does not need to correspond to a real upload secret. The `UploadsRewriter` constructs a path like:

```
/var/opt/gitlab/uploads/<project-id>/11111111111111111111111111111111/../../../../../../../../../../../../../../etc/passwd
```

After path resolution, the traversal sequences collapse and the effective path becomes `/etc/passwd`. The secret value is arbitrary because the traversal escapes its directory before the secret segment has any meaning.

**Step 3 — Move the issue to the destination project.** Use the "Move Issue" option in the issue sidebar and select the destination project. GitLab's backend invokes `UploadsRewriter`, which finds the markdown pattern, calls `find_file` with the traversal string, and — because `file.try(:exists?)` returns `true` for `/etc/passwd` — proceeds to copy the file into the destination project's upload storage.

**Step 4 — Retrieve the copied file.** After the move completes, the issue description in the destination project will contain an updated upload URL pointing to the newly copied file. Navigating to that URL delivers the contents of `/etc/passwd`. The same technique applies to any readable file on the server: GitLab secret tokens (`/etc/gitlab/gitlab-secrets.json`), database credentials, private keys, or application configuration files.

---

## The Report

A strong report for this vulnerability leads with a precise, unambiguous title that names the vulnerable component and the primitive it enables: "Arbitrary File Read via Path Traversal in UploadsRewriter during Issue Move." Vague titles like "File Upload Issue" or "Security Bug in GitLab" slow triage because they do not communicate scope or exploitability.

Severity justification should reference the CVSS dimensions directly: network-accessible (AV:N), no privileges beyond a basic account required (PR:L), no user interaction beyond the attacker's own actions (UI:N), and complete confidentiality impact (C:H) given access to server secrets and configuration files. This report's $20,000 bounty reflects a Critical rating, which is warranted because reading `/etc/gitlab/gitlab-secrets.json` or similar token stores can enable follow-on attacks including remote code execution via deserialization.

Reproduction steps should be written so that a triager with a fresh GitLab instance can follow them without ambiguity. Enumerate exact steps: create Project A, create Project B, create an issue in Project A with the exact payload, move the issue, navigate to the resulting upload URL. Include the GitLab version tested — in this case 12.8.7-ee — and the output of `sudo gitlab-rake gitlab:env:info` to confirm environment compatibility.

The impact statement should go beyond "reads files" and name specific targets: `/etc/passwd`, `/etc/gitlab/gitlab-secrets.json`, application credential files, and SSH private keys under the `git` user's home directory. Triagers accept reports faster when the real-world consequence is spelled out, rather than left as an exercise.

---

## The Takeaway

The core insight is this: any feature that uses a regex to extract a user-controlled filename from structured text and then passes that filename to a filesystem operation — without path normalization or directory confinement — is vulnerable to path traversal, regardless of how indirect or multi-step the data flow appears.

To find similar bugs, map all code paths where user input flows into file operations: search codebases for calls to `File.open`, `File.read`, `FileUtils.cp`, `send_file`, `retrieve_from_store!`, or equivalent methods, then trace backwards to find where the path argument originates. Any hop that crosses a trust boundary without sanitization is a candidate. In black-box testing, look for features that move, copy, or export data between organizational units — migrations, exports, cloning, templating — because these operations frequently perform server-side file I/O that mirrors user-supplied references.

Tools that assist in this class of research include Burp Suite (for intercepting and modifying the issue body before submission), GitLab's own source code (published publicly on gitlab.com), and a local Docker-based GitLab instance for safe, legal testing. Common variants of this vulnerability appear in file export features, avatar uploading pipelines, attachment importers, and any markdown or rich-text renderer that resolves relative paths server-side. The pattern — user-controlled string, regex extraction, unvalidated filesystem operation — recurs across dozens of platforms and frameworks whenever developers trust the structure of a URL path without enforcing a root boundary.
