---
title: "gitlab-workhorse bypass in Gitlab::Middleware::Multipart allowing files in `allowed_paths` to be read"
slug: "gitlab-workhorse-bypass-in-gitlab-middleware-multipart-allow"
platform: "hackerone"
vuln_class: "Information Disclosure"
difficulty: "hard"
scope_type: "web"
bounty: 10000
program: "GitLab"
reporter: "vakzz"
published_at: "2020-06-08"
source_url: "https://hackerone.com/reports/850447"
tags: []
teaser: "A path traversal in GitLab's multipart middleware let attackers read arbitrary files by exploiting the trusted `allowed_paths` allowlist itself."
---

## The Program

GitLab is one of the most widely deployed DevOps platforms in the world, used by enterprises, governments, and open-source projects to manage source code, CI/CD pipelines, package registries, and wikis. Its self-hosted nature means vulnerabilities don't just affect GitLab.com — they affect every organization running their own instance, which numbers in the hundreds of thousands. The GitLab bug bounty program on HackerOne is among the most active and well-funded in the industry, regularly awarding critical findings in the five-figure range.

GitLab's architecture is more complex than a typical web application. Rather than handling all HTTP traffic in a single Rails process, it routes requests through a reverse proxy layer called **gitlab-workhorse** — a Go service that sits in front of the Rails application. Workhorse handles large file uploads, git smart HTTP protocol, and other bandwidth-intensive operations before passing sanitized requests downstream. This two-tier design is precisely what made the upload pipeline a rich attack surface: any time two components must agree on the meaning of a request, there is potential for disagreement.

The upload acceleration system specifically was worth investigating because it involves a security contract between workhorse and Rails. Workhorse accepts a raw file from a client, writes it to a temporary path, cryptographically signs metadata about that upload (including the path), and passes that signed JWT to Rails. Rails is then supposed to trust only workhorse-signed paths. A bypass of this contract would mean Rails could be tricked into treating an attacker-supplied path as a legitimate, workhorse-approved file location — an extremely high-value primitive on a server that stores source code, CI artifacts, and credentials.

---

## The Recon

The starting point was an already-disclosed nuget package workhorse bypass (referenced in the GitLab issue tracker). Rather than treating that fix as the end of the story, the research continued by examining *why* the bypass worked — looking at the patch itself to understand what class of behavior had been corrected and whether the fix was narrow or systemic. This is a critical recon habit: disclosed fixes often leave adjacent, unpatched behavior intact.

The GitLab wiki API endpoint — `POST /api/v4/projects/:id/wikis/attachments` — was identified as a promising target because it supports file uploads and uses the accelerated upload mechanism. The API accepts both a multipart form body (for the actual file) and query string parameters (for metadata). Examining the GitLab source code for the `Gitlab::Middleware::Multipart` middleware revealed the core logic: Rails parses multipart field names and checks them against a list of expected fields. Workhorse is supposed to replace file fields in the payload with a signed reference to a temporary path.

The `allowed_paths` method in the middleware was located in the Rails codebase and found to enumerate four distinct directories — the file uploader root, the uploads storage path, the job artifact uploader path, and `public/uploads/tmp`. Any file residing within these directories could potentially be accessed if the path-substitution mechanism could be bypassed. The `/proc` filesystem on Linux was also noted as a powerful oracle: `/proc/PID/cwd` resolves to the working directory of a running process, and `/proc/PID/fd/N` resolves to open file descriptors — meaning symlink traversal through `/proc` could reach files outside `allowed_paths`.

The key tool for this phase was `curl` with verbose output (`-v`), which made request and response headers fully visible. The GitLab source code was browsed directly on `gitlab.com` to trace how multipart field names were parsed, how JWT verification worked, and what the `Rack::Utils.parse_nested_query` function would return for unusual bracket-notation field names like `[file]`.

---

## The "Wait a Second..." Moment

The critical observation came from understanding what `Rack::Utils.parse_nested_query("[file]")` actually returns. When Rails receives a multipart upload, it takes the field name, parses it as a nested query string, and uses the result to decide whether the field matches an expected upload parameter. A field named `[file]` parses to `{"file" => nil}` — which is structurally identical to what a field named `file` would produce. This meant the validation check passed as if workhorse had signed the request. However, the actual handler that processes the upload uses the raw query parameters from the URL rather than the multipart payload — so passing `?file.path=/tmp/ggg` in the URL while sending `[file]=@/tmp/lala.txt` in the body caused Rails to use `/tmp/ggg` as the file path, completely bypassing the workhorse signing requirement.

What made this particularly alarming was the behavior of the wiki attachments endpoint specifically. Other upload endpoints moved the temporary file (which required the file to be owned by the `git` user), but the wiki endpoint called `attrs[:file].read` — it read the file contents directly into memory and stored them as a wiki attachment. This distinction meant file ownership restrictions did not apply, and files owned by `root` or any other user were equally readable as long as the path was accessible to the Rails process. A single endpoint thus opened up a much broader read primitive than the original nuget bypass.

---

## The Exploit

The following steps describe the exploitation path using the wiki attachments API, which is the most permissive variant of the bypass.

**Step 1 — Set up prerequisites.** A GitLab account with a valid API token is required, along with an existing project that has the wiki enabled. Create a wiki page to serve as the destination for the stolen file attachment.

**Step 2 — Identify a target file.** Select any file on the server that the Rails process (`git` user) can read and that falls within one of the `allowed_paths` directories, or is reachable via `/proc` symlinks. For a demonstration, a known path like `/opt/gitlab/embedded/service/gitlab-rails/public/422.html` (a static HTML error page) works reliably.

**Step 3 — Create a decoy file locally.** The multipart body requires *some* file to be attached. The content of this file is irrelevant; it is never used by the server.

```bash
echo unused > /tmp/lala.txt
```

**Step 4 — Send the crafted request.** The field name uses bracket notation (`[file]`) instead of the expected `file`, and the target file path is passed as a query parameter (`file.path`):

```bash
curl -g -XPOST -H "Authorization: Bearer $TOKEN" \
  'http://gitlab-vm.local/api/v4/projects/171/wikis/attachments?file.path=/opt/gitlab/embedded/service/gitlab-rails/public/422.html' \
  -F '[file]=@/tmp/lala.txt'
```

A successful response returns a JSON object containing a `file_path` field pointing to a newly created wiki attachment.

**Step 5 — Retrieve the stolen file.** Navigate to the wiki page, paste the markdown link from the response, and the attachment download serves the contents of the server-side target file.

**Step 6 (advanced) — Steal in-flight uploaded files via `/proc`.** First, discover a valid Unicorn worker PID by iterating over `/proc/PID/cwd` until a readable symlink is found (the Unicorn worker's `cwd` points to the GitLab Rails working directory). Then loop over file descriptor paths while other users are uploading files:

```bash
while true; do
  curl -s -XPOST -H "Authorization: Bearer $TOKEN" \
    'http://gitlab-vm.local/api/v4/projects/171/wikis/attachments?file.path=/proc/19603/fd/44' \
    -F '[file]=@/tmp/lala.txt' | grep file_name
done
```

When the timing aligns with another user's upload being processed by that worker, the response will contain that user's uploaded file contents rather than an error.

---

## The Report

The report title should be precise and technical: naming both the bypassed component and the vulnerable middleware makes triage instant — something like *"gitlab-workhorse JWT bypass via bracket field names in Multipart middleware allows arbitrary file read"* communicates the mechanism, the affected component, and the impact in a single line.

Severity justification for a Critical rating rests on three factors: no authentication beyond a standard user account is required; the impact is file read across a broad set of server paths including those likely to contain secrets, source code, and CI artifacts; and the `/proc/fd` variant allows reading other users' uploaded files in real time without knowing their contents in advance. Each of these factors should be stated explicitly in the report, not left for the triager to infer.

Reproduction steps should be self-contained: include the exact `curl` commands, specify which GitLab version was tested (in this case, 12.9.3-ee on Ubuntu 18.04), and attach a screenshot or response body showing the stolen file content served from the wiki. The report also benefits from linking the prior nuget bypass (report 835455) to establish that this is a related but broader vulnerability class — context that helps the security team understand scope and prioritize a systemic fix over a point fix.

The impact statement should enumerate distinct attack scenarios separately: reading known files within `allowed_paths`, reading root-owned files via the wiki endpoint's `read` behavior, and the race-condition `/proc/fd` technique for stealing in-flight uploads from other users. Separating these makes the full blast radius visible and helps GitLab's team draft an accurate CVE description and advisory.

---

## The Takeaway

The core insight is this: **any time two components must agree on the structure of a request parameter, testing whether they parse bracket-notation, dot-notation, or array-suffix field names identically can reveal a validation bypass.** Rack's `parse_nested_query` normalizes `[field]` to `{"field" => nil}` — but if the downstream handler uses raw query params rather than the parsed result, the two representations diverge and the security contract breaks.

Similar bugs appear wherever a middleware or proxy layer signs or validates a request before passing it to an application server. API gateways that validate JWT claims but pass raw headers downstream, WAFs that inspect a normalized form of a parameter while the application reads the raw form, and any multipart handler that trusts proxy-signed metadata are all candidates for this class of vulnerability.

Tools that help surface this pattern include Burp Suite's Intruder (for fuzzing field name syntax variants), `curl` with `-g` to disable glob expansion (necessary when bracket characters appear in URLs), and direct source code review of the middleware stack — particularly anywhere a field name is parsed, normalized, or matched against an allowlist. The `/proc` filesystem variant is a reminder that file read primitives on Linux are often far more powerful than they initially appear: process file descriptor symlinks, `/proc/self/environ` for environment variables, and `/proc/net/tcp` for internal network state can all become readable once an arbitrary path read exists.
