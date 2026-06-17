---
title: "AWS keys and user cookie leakage via uninitialized memory leak in outdated librsvg version in Basecamp"
slug: "aws-keys-and-user-cookie-leakage-via-uninitialized-memory-le"
platform: "hackerone"
vuln_class: "Information Disclosure"
difficulty: "medium"
scope_type: "web"
bounty: 8868
program: "Basecamp"
reporter: "neex"
published_at: "2023-09-21"
source_url: "https://hackerone.com/reports/2107680"
tags: []
teaser: "Stale memory in an outdated SVG library silently exposed AWS credentials and session cookies through a single malformed image upload."
---

## The Program

Basecamp is a widely adopted project management and team collaboration platform serving hundreds of thousands of businesses. Its bug bounty program on HackerOne covers the core `3.basecamp.com` web application, making it an attractive target for researchers focused on web application security. The platform handles sensitive organizational data — internal communications, file storage, and credentials — which raises the stakes considerably for any vulnerability that touches server-side processing.

Basecamp's feature set includes rich media handling: users can upload profile avatars, attach files to messages, and share documents. Server-side image processing is a common source of vulnerabilities because it involves executing third-party native code (image parsing libraries written in C or C++) on attacker-controlled input. These libraries have historically been fertile ground for memory corruption bugs, format confusion issues, and information disclosure.

The avatar upload endpoint at `3.basecamp.com` was particularly interesting because it accepted SVG files — a format that is fundamentally different from raster images. SVG is XML-based and supports complex rendering features including filters, gradients, and scripting hooks. When a server renders an SVG through a native library like `librsvg`, it executes a significant amount of logic on untrusted input. The fact that SVG avatars triggered a server-side conversion pass (rather than being stored and served as-is) meant that a vulnerable rendering path was directly reachable by any authenticated user.

---

## The Recon

The investigation began with a standard feature audit of the Basecamp profile settings page. Navigating to the avatar change interface revealed that the platform accepted image uploads and subsequently displayed a processed preview — a strong signal that server-side image conversion was occurring, not just storage and passthrough. The "Change your avatar" button accepted image files, and after uploading, a pixel-rendered version of the image appeared in the UI rather than the original file being served directly.

The key observation during recon was the URL structure of the resulting avatar. After uploading an image, right-clicking the rendered avatar and copying the image address produced a redirect chain: the initial URL (something resembling a signed internal reference tied to the user ID) redirected to a CDN-hosted URL with an `.avif` extension. This is significant — `.avif` is a modern compressed image format, meaning the server was transcoding uploaded images through a conversion pipeline before caching them on a CDN.

By inspecting the final CDN URL structure, it became clear that the filename component before the extension was variable and that the extension itself could be substituted. Replacing `.avif` with `.png` in the CDN URL caused the server to re-render and serve the image in PNG format. This meant the conversion pipeline could be triggered on demand, repeatedly, simply by requesting different filenames with a different extension — a critical detail for later exploitation, since it allowed the attacker to repeatedly fetch freshly leaked memory contents.

The version of `librsvg` in use at Basecamp was outdated. `librsvg` is a GNOME library for rendering SVG files, implemented in C (and later partially Rust). Older versions of this library contain an uninitialized memory disclosure bug: during certain filter operations, a memory buffer is allocated (`malloc`'d) but never zeroed before being used to compose pixel output. The rendered image therefore contains literal bytes from whatever happened to occupy that heap region — which, in a long-running web server process, includes fragments of request data, configuration values, and application internals.

---

## The "Wait a Second..." Moment

The turning point came when decoding the pixel data extracted from a rendered avatar image and passing it through `strings` to filter for printable sequences. Instead of seeing noise or fragments of the original SVG payload, the output contained recognizable application data: YAML configuration blocks with key-value pairs, HTTP request headers, and fragments of Ruby source code. The structure of the data — YAML keys named `access_key_id` and `secret_access_key`, formatted exactly as Rails credential files are written — made it immediately clear that server memory was being leaked directly into the image pixels.

The severity became concrete when `aws sts get-caller-identity` returned a valid response using credentials extracted from the leaked memory, confirming that the keys were live and associated with a real IAM user (`bc3-storage`) tied to Basecamp's AWS account. Separately, HTTP request headers recovered from the same leak contained full session cookies belonging to other authenticated users — meaning the vulnerability was leaking both static secrets (cloud credentials) and live session material from concurrent requests processed in the same server process.

---

## The Exploit

**Step 1 — Generate the malicious SVG payload**

A Python script (`rsvgeb.py`) was used to craft an SVG file that, when processed by the vulnerable `librsvg` version, encodes uninitialized heap bytes into the rendered pixel output in a recoverable way. The SVG uses carefully chosen filter chains to make the leaked bytes survive the lossy compression applied during conversion. The generation command was:

```
python3 rsvgeb.py gen 260x260 --format bmp zalupa.png
```

The output file (`zalupa.png`) is actually an SVG despite the `.png` extension. The dimensions `260x260` match the expected avatar size to maximize the usable pixel area for encoding leaked data.

**Step 2 — Upload as avatar**

The crafted SVG was uploaded through the standard avatar change interface in Basecamp's profile settings. After saving, the UI displayed a pixelated rendering — the server had processed the SVG through `librsvg` and cached the output on the CDN.

**Step 3 — Retrieve and decode leaked memory**

After installing ImageMagick (required for pixel extraction), the CDN URL for the rendered avatar was obtained by right-clicking the avatar and following the redirect. The URL was then modified: the `.avif` extension was replaced with `.png`, and the filename was replaced with a randomized string to bypass CDN caching and force a fresh render on each request. A loop was run continuously:

```
while true; do curl "<CDN_URL>/$RANDOM$RANDOM$RANDOM$RANDOM.png?v=1" | python3 rsvgeb.py recover 260x260 - | strings -n 10 | tee -a output.txt; done
```

Each iteration fetched a freshly rendered PNG, decoded the pixel data back into raw bytes, and extracted printable strings of at least 10 characters. Because the server re-ran the `librsvg` conversion on each unique filename request, each response reflected a different snapshot of heap memory — accumulating diverse data over time. Running this loop for an extended period (48+ hours in the original research) produced a wide variety of leaked content including AWS credentials, S3 bucket names, New Relic license keys, active record encryption keys, and raw HTTP request headers with session cookies belonging to other users.

**Step 4 — Validate extracted credentials**

Extracted AWS key pairs were validated using the AWS CLI without performing any destructive actions:

```
AWS_DEFAULT_REGION=us-east-2 AWS_ACCESS_KEY_ID=<extracted> AWS_SECRET_ACCESS_KEY=<extracted> aws sts get-caller-identity
```

A successful response confirming a valid IAM identity demonstrated that the credentials were live and functional.

---

## The Report

A strong report for this vulnerability leads with a precise title that names the root cause and the impact: "Uninitialized memory disclosure via outdated librsvg in SVG avatar processing leaks AWS credentials and user session cookies." This immediately communicates to the triage team what library is involved, what the mechanism is, and what the worst-case outcome looks like.

**Severity justification:** The CVSS 8.6 (High) rating reflects unauthenticated-to-authenticated escalation, broad impact on confidentiality, and the fact that live AWS credentials were extracted and verified. The report should explicitly state that a valid `aws sts get-caller-identity` response was obtained — this single line of proof transforms a theoretical information disclosure into a demonstrated, verified credential exposure. Session cookie leakage affecting third-party users adds a horizontal privilege escalation dimension.

**Reproduction steps** should be structured so that a triage engineer without deep binary exploitation knowledge can follow them. The report achieved this by packaging all complexity into a single Python script and providing exact shell commands. Each step specifies prerequisites (Python, ImageMagick), exact command syntax, and what the expected output looks like. Ambiguity at any step creates friction and slows triage.

**Impact statement** should address the worst case, not the average case. Even though the attacker cannot control which memory region is leaked, the demonstrated extraction of production AWS keys and live session cookies for real users is sufficient. The report should also note the process isolation failure: the fact that the image converter runs in the same process as the Rails application is the architectural root cause that makes any `librsvg` bug this catastrophic. Proposing mitigations (update librsvg, isolate the converter in a Docker container without network access) demonstrates good faith and helps the program understand remediation scope, which generally accelerates bounty payment.

---

## The Takeaway

The core insight is that server-side image processing libraries are native code attack surfaces that inherit the full memory context of the host process — so running them in-process with a web application converts any memory disclosure bug in the library into a full application secret dump.

To find similar bugs, the approach is to map every endpoint that accepts image uploads and determine whether the server performs a conversion pass (look for a change in file format, dimensions, or filename in the served output, which signals transcoding). Tools like Burp Suite's passive scanner can flag redirects and CDN URLs that suggest server-side processing. Once a conversion pipeline is identified, the next step is fingerprinting the library version — response headers, error messages, or timing behavior can sometimes reveal which renderer is in use and whether it matches a known CVE. The `librsvg` changelog and the GNOME security advisories are useful references for understanding which versions are affected by which classes of bugs.

Common variants of this pattern appear in PDF rendering pipelines (Ghostscript, poppler), office document converters (LibreOffice in headless mode), and video thumbnail generators (FFmpeg). Any web application that converts user-supplied rich media formats through a native library and serves the output is a candidate for this class of vulnerability. The mitigating architecture — spawning a fresh, network-isolated subprocess for each conversion job — is the correct fix, and its absence is itself a finding worth noting in reports even when no specific CVE can be demonstrated.
