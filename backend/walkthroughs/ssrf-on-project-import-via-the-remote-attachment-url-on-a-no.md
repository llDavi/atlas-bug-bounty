---
title: "SSRF on project import via the remote_attachment_url on a Note"
slug: "ssrf-on-project-import-via-the-remote-attachment-url-on-a-no"
platform: "hackerone"
vuln_class: "Server-Side Request Forgery (SSRF)"
difficulty: "medium"
scope_type: "web"
bounty: 10000
program: "GitLab"
reporter: "vakzz"
published_at: "2020-06-07"
source_url: "https://hackerone.com/reports/826361"
tags: []
teaser: "A hidden URL parameter in project note imports silently fetched internal network resources, turning a collaboration feature into an SSRF vector."
---

## The Program

GitLab is one of the most widely deployed DevOps platforms in the world, used by enterprises, governments, and open-source communities to host code, run CI/CD pipelines, and manage the full software development lifecycle. Its self-hosted and SaaS deployment models mean that a single vulnerability can affect thousands of distinct installations simultaneously. GitLab runs a public bug bounty program on HackerOne, and its scope includes gitlab.com as well as the open-source Community Edition and the commercial Enterprise Edition codebases.

The project import and export feature is a natural target for security research because it sits at the intersection of serialization, file handling, and privileged server-side operations. When a project is exported, GitLab serializes its full object graph — issues, merge requests, notes, attachments — into a compressed archive. When that archive is re-imported, the server deserializes and recreates each object. This kind of round-trip processing, where attacker-controlled data is trusted and acted upon server-side, is historically fertile ground for bugs.

What makes this attack surface particularly notable is the combination of two factors: the import process runs with the full privileges of the GitLab application server, and the project.json file inside the export archive is entirely attacker-controlled. Any attribute the application processes during import without sanitization becomes a potential injection point — whether for SQL, path traversal, or, as in this case, server-side request forgery.

---

## The Recon

The starting point for this research was the GitLab project export feature itself. Exporting a project from GitLab produces a `.tar.gz` archive containing a `project.json` file. Extracting this archive reveals a rich JSON structure where every object in the project — issues, milestones, merge requests, notes — is represented as a hash with its full set of database-level attributes. Reading the Rails source code for the import process shows that these attributes are fed back into ActiveRecord model constructors during import.

The next step was identifying which model attributes get sanitized before import. GitLab uses an `AttributeCleaner` class designed to strip out dangerous or internal-only attributes from imported objects. Reviewing the cleaner's configuration reveals which attribute names it blocks. The key question is: what attributes exist on importable models that are *not* on the blocklist? This requires cross-referencing the model definitions in the GitLab codebase with the cleaner's exclusion list.

The `Note` model was identified as using CarrierWave, a popular Ruby file upload library, to manage its `attachment` field. The relevant model line is `mount_uploader :attachment, AttachmentUploader`. CarrierWave's `mount_uploader` macro automatically generates a family of setter methods on the model, including `remote_attachment_url=`. This setter, when called with a URL string, instructs CarrierWave to perform an HTTP fetch of that URL and store the response as the attachment. This is a documented CarrierWave feature intended for seeding uploads from remote sources.

The critical observation came from examining whether `remote_attachment_url` appeared in the `AttributeCleaner` blocklist. It did not. This meant that if the string `"remote_attachment_url"` were added as a key inside a note's hash in `project.json`, the importer would call `note.remote_attachment_url = <value>`, triggering a server-side HTTP request to whatever URL was supplied. The same analysis also revealed that `remote_attachment_request_header=` — which allows setting arbitrary HTTP request headers — was equally unblocked.

---

## The "Wait a Second..." Moment

The moment of clarity arrived when tracing how CarrierWave processes the `remote_attachment_url` attribute during model instantiation. The library's mounter code calls `uploader.download!(url, headers)`, which in turn calls `Kernel.open(@uri.to_s, headers)`. In Ruby, `Kernel.open` on an HTTP URI performs a live HTTP request to the specified address. This is not an asynchronous or deferred operation — it happens inline, on the GitLab application server, at the moment the note is being saved during import. The server is making an outbound HTTP request to a URL that came directly from the attacker-supplied `project.json` file.

What made this particularly impactful was the second realization: the result of the fetch is stored as the note's attachment and is subsequently accessible through the imported project's UI. An attacker can not only make the GitLab server contact an arbitrary internal host — the response body is exfiltrated back to the attacker by simply viewing the note after import completes. This transforms a blind SSRF into a fully readable one, dramatically expanding the severity.

---

## The Exploit

**Step 1 — Create a sacrificial project.**
On any GitLab instance (including gitlab.com), create a new project, then create an issue inside it, and add at least one comment (note) to that issue. The note can have any content; its purpose is just to produce a note entry in the export.

**Step 2 — Export the project.**
Navigate to *Settings → General → Advanced → Export project*. Download the resulting `.tar.gz` archive.

**Step 3 — Extract and modify the archive.**
```bash
tar -xzf project_export.tar.gz
```
Open `project.json` in a text editor. Locate the `notes` array inside the issue objects. Find the note hash and add the `remote_attachment_url` key with the target internal URL as its value:

```json
{
  "note": "some comment text",
  "attachment": null,
  "remote_attachment_url": "http://169.254.169.254/latest/meta-data/",
  ...
}
```

For a safe proof-of-concept during testing, use a service like PostBin or interactsh instead of an internal address — this captures the request without accessing sensitive data.

**Step 4 — Recompress the archive.**
```bash
tar -czf modified_export.tar.gz project.json uploads/ (and any other extracted files)
```

**Step 5 — Import the modified archive.**
Create a new project and select *Import project → GitLab export*, then upload the modified archive.

**Step 6 — Observe the result.**
Once the import completes, navigate to the imported project's issue and view the note. The CarrierWave attachment link on the note will contain the HTTP response body fetched from the target URL. For internal metadata endpoints, this reveals instance identity, credentials, or network topology. The successful exploitation is confirmed when the attachment file contains the response from the internal address rather than an externally hosted file.

**Optional amplification — custom request headers.**
Because `remote_attachment_request_header` is also unblocked by the `AttributeCleaner`, arbitrary HTTP headers can be injected into the server-side request:

```json
{
  "remote_attachment_url": "http://metadata.google.internal/computeMetadata/v1/",
  "remote_attachment_request_header": {"Metadata-Flavor": "Google"},
  ...
}
```

This bypasses GCP's SSRF mitigation that requires the `Metadata-Flavor: Google` header.

---

## The Report

A strong report title names the attack class, the entry point, and the affected parameter precisely: *"SSRF via remote_attachment_url on Note model during project import"*. Vague titles like "SSRF in import" delay triage because they give no indication of which of GitLab's many import paths is affected.

The severity justification should connect the SSRF to concrete impact rather than stopping at "internal requests are possible." The report should enumerate what internal services are reachable: Prometheus exporters, Alertmanager, and Redis are all localhost-bound in default Omnibus installations. If the target runs on AWS or GCP, instance metadata endpoints (`169.254.169.254` or `metadata.google.internal`) give unauthenticated access to IAM credentials, which can escalate to full cloud account compromise. If Redis is reachable via TCP, the report should note the public Redis-SSRF-to-RCE techniques (RESP protocol injection via Gopher) as a realistic escalation path, even if not fully demonstrated. This report specifically called out that `remote_attachment_request_header` enables the Google `Metadata-Flavor` header bypass — that detail elevates the finding from theoretical to demonstrated critical impact.

Reproduction steps should be written as a numbered list with no assumed context: create project, create issue, add note, export, extract, modify JSON (with the exact key name and an example value), recompress, import, view result. Attach a working proof-of-concept archive with the SSRF payload already injected pointing to a safe out-of-band callback URL. Screenshots or a screen recording showing the callback request appearing and the response visible in the note attachment dramatically speed up triage. Include the GitLab version, the Ruby/Rails environment, and a link to the relevant CarrierWave source code lines — this gives the triage team immediate pointers for a fix and removes any ambiguity about the root cause.

---

## The Takeaway

The core insight is that ORM-level "magic" methods generated by library macros — CarrierWave's `remote_*_url=` setters, Paperclip's remote URL methods, ActiveStorage variants — represent an invisible attack surface that application-level input sanitization lists almost never account for by name.

To find similar bugs, the hunting pattern is: identify any Rails application that uses a file upload library with `mount_uploader` or equivalent, locate any feature that deserializes attacker-controlled attribute hashes into model constructors (imports, bulk updates, API endpoints accepting raw attribute maps), and then enumerate the full set of methods that the upload macro generates on the model. Cross-reference that list against whatever sanitization or permit-list the application applies. Any generated method not explicitly blocked is a candidate.

Tools that help: reading CarrierWave, Shrine, ActiveStorage, and Paperclip source code to understand what methods they generate; using `grep` or `ripgrep` across a Rails codebase for `mount_uploader` declarations; and using out-of-band HTTP callback services (Burp Collaborator, interactsh, canarytokens.org) to confirm blind SSRF before attempting to read responses. Common variants of this pattern appear anywhere serialized data drives model construction — YAML deserialization, JSON:API bulk endpoints, GraphQL input objects, and CSV import features all warrant the same scrutiny.
