---
title: "Stealing SSO Login Tokens (snappublisher.snapchat.com)"
slug: "stealing-sso-login-tokens-snappublisher-snapchat-com"
platform: "hackerone"
vuln_class: "Authentication Bypass"
difficulty: "medium"
scope_type: "web"
bounty: 7500
program: "Snapchat"
reporter: "coolboss"
published_at: "2021-07-29"
source_url: "https://hackerone.com/reports/265943"
tags: []
teaser: "A misconfigured SSO flow on Snapchat's publisher portal allowed attackers to intercept and hijack login tokens mid-authentication."
---

## The Program

Snapchat operates one of the more expansive bug bounty programs in the social media space, covering not just its consumer-facing mobile app but the entire constellation of business and creator tools that sit behind the main brand. SnapPublisher (`snappublisher.snapchat.com`) is one such tool — a creative suite allowing advertisers and partners to produce Snap ad content. Ads Manager and Business Manager fall into the same family. Because these platforms handle advertiser accounts, campaign assets, and billing relationships, a compromise carries significant business and reputational weight beyond a typical social account takeover.

The SSO architecture tying these tools together was the interesting angle. Rather than each product maintaining its own authentication stack, Snapchat centralized login through `accounts.snapchat.com`, issuing short-lived (or supposedly short-lived) ticket tokens that downstream services consumed. This pattern — a hub-and-spoke SSO model — is extremely common in larger organizations and is a well-known source of authentication bugs. Any flaw in the token issuance, transport, or validation layer gets amplified across every service in the constellation.

What made this particular surface worth investigating was the combination of file upload functionality and SSO token delivery in the same application. SnapPublisher allowed users to import creative assets, meaning attacker-controlled content could potentially reach the same domain that received sensitive authentication tokens. That co-location of user-supplied content and privileged token flows is a red flag worth examining closely.

---

## The Recon

The investigation began by mapping the SSO login flow from scratch using a browser with a proxy (Burp Suite is standard for this) to capture every redirect. When a logged-in `accounts.snapchat.com` user navigates to SnapPublisher, the browser makes a request to `https://accounts.snapchat.com/accounts/login?client_id=creativesuite-prod&referrer=https://snappublisher.snapchat.com/sso_continue`. That triggers a chain: a 302 to the `/accounts/sso` endpoint, then another 302 delivering the actual token to the `referrer` destination — `https://snappublisher.snapchat.com/sso_continue?ticket=<TOKEN>`. Writing down every parameter at every step is critical. Here the key parameters are `client_id` and `referrer`.

The `referrer` parameter immediately invites testing. It accepts a URL that determines where the SSO endpoint sends the `ticket` token. The natural first question is: how strictly is this value validated? Is it an exact match against a whitelist, a prefix match, or something looser? Testing revealed that any URL under `snappublisher.snapchat.com` was accepted — not just the intended `/sso_continue` path. That is a significant overpermission. The validation was domain-scoped rather than path-scoped.

The second recon thread focused on the file upload feature reachable at `https://snappublisher.snapchat.com/snaps/create/new`. The "import from site" functionality allowed SVG images to be pulled in and stored. SVG files are interesting because they are XML documents that can contain embedded JavaScript — browsers execute that JavaScript when the SVG is rendered directly (not as an `<img>` tag). Testing confirmed that an uploaded SVG containing a `<script>` block would execute when the file URL was opened directly.

Combining these findings on paper produced a recognizable shape: there was an upload endpoint that could host attacker-controlled JavaScript, and there was a token-delivery endpoint that could be redirected to any path on the same domain. The stored SVG URL was `https://snappublisher.snapchat.com/api/v1/media/<id>/file/somethine.svg`. A URL under attacker control, on the trusted domain, capable of running JavaScript. The final piece was understanding how the media endpoint handled requests — specifically, whether it issued a 307 redirect to the actual Google Cloud Storage URL, and whether the browser would carry the URL fragment through that redirect.

---

## The "Wait a Second..." Moment

The critical realization arrived when testing hash fragments in the `referrer` parameter. URL fragments (the `#...` portion) are normally stripped before a request leaves the browser — servers never see them. But when a server issues a 307 redirect, the browser appends the original fragment to the new destination URL before following the redirect. This is specified browser behavior, not a bug in the browser. The SSO endpoint was accepting `%23` (URL-encoded `#`) inside the `referrer` parameter and not stripping it. So a `referrer` value of `https://snappublisher.snapchat.com/api/v1/media/<id>/file/somethine.svg?%23pranav` would cause the SSO token to arrive as: `https://snappublisher.snapchat.com/api/v1/media/<id>/file/somethine.svg?ticket=TOKEN#pranav`. The media endpoint then 307-redirected to Google Cloud Storage, carrying the fragment. The SVG at that GCS URL executed, and the fragment — now containing the `ticket` value — was accessible via `window.location.hash`.

A stolen SSO token is immediately actionable: visiting `https://snappublisher.snapchat.com/sso_continue?ticket=<stolen>` logs in as the victim. The token also worked as an `Authorization` header value for direct API calls. The moment the token appeared in the SVG's console log, the full chain became clear — an open redirect within the SSO flow, feeding a reflective XSS-by-SVG, all triggered without any user interaction beyond clicking a link.

---

## The Exploit

The complete attack chains four distinct weaknesses. Each step below describes what happens and why it succeeds.

**Step 1 — CSRF Login (Force the victim into the attacker's SnapPublisher session)**

The SSO login endpoint at `https://snappublisher.snapchat.com/sso_continue?ticket=<TOKEN>` lacked a `state` parameter or any CSRF protection. An attacker who possesses their own valid ticket can craft a link that logs the victim into the attacker's SnapPublisher account. This matters because the next step fetches a token tied to whichever `accounts.snapchat.com` session the browser currently holds — which belongs to the victim.

**Step 2 — Craft the malicious SSO request URL**

The attacker constructs a URL that invokes the SSO flow but redirects the resulting ticket to the attacker-controlled SVG:

```
https://accounts.snapchat.com/accounts/sso?client_id=creativesuite-prod&referrer=https://snappublisher.snapchat.com/api/v1/media/<ATTACKER_MEDIA_ID>/file/somthine.svg?%23x
```

The `referrer` domain passes validation (it is under `snappublisher.snapchat.com`). The `%23x` encodes `#x`, a fragment that will survive the redirect chain.

**Step 3 — The 307 redirect carries the fragment**

When `accounts.snapchat.com` issues its redirect, the browser navigates to:

```
https://snappublisher.snapchat.com/api/v1/media/<ID>/file/somthine.svg?ticket=STOLEN_TOKEN#x
```

The media API endpoint returns a `307 Temporary Redirect` pointing to Google Cloud Storage. The browser carries the full fragment, including the ticket value, to the GCS URL.

**Step 4 — The SVG executes and exfiltrates the token**

The SVG file hosted on GCS contains JavaScript that reads `window.location.hash` and sends its value to an attacker-controlled server (or simply logs it, as in the proof of concept). The token is now in the attacker's hands.

**Step 5 — Log in as the victim**

The token does not expire after first use. The attacker visits:

```
https://snappublisher.snapchat.com/sso_continue?ticket=<STOLEN_TOKEN>
```

The session is now authenticated as the victim. API calls using the token in an `Authorization` header also succeed.

The victim's role in this attack is passive: the CSRF login step and the SSO fetch can be triggered by embedding both requests in a single malicious page the victim visits while logged into `accounts.snapchat.com`.

---

## The Report

A strong report for this vulnerability would carry a title like: **"SSO Token Theft via Open Referrer Redirect + SVG XSS + CSRF Login Chain (snappublisher.snapchat.com)"** — specific enough that a triager immediately understands the attack class and affected asset without reading the body.

Severity justification should focus on impact, not just technique. Account takeover on an advertising platform means unauthorized access to campaigns, spend data, creative assets, and potentially the ability to run fraudulent ads. The fact that the token is reusable and non-expiring elevates severity further — there is no natural remediation window once a token is stolen. High severity is well-supported; Critical could be argued given the non-expiring token behavior.

Reproduction steps should be numbered, atomic, and self-contained. Each step should describe exactly one action and its observable result. For a chain like this one, it helps to include a section that explains each vulnerability independently before showing the combined attack — triagers often need to understand the components to validate that none of the steps are theoretical. Include the SVG payload source, the exact URLs with parameters, and a screen recording. The proof-of-concept video that appeared in this report is exemplary — it eliminates ambiguity about whether the exploit actually works.

The impact statement should name concrete consequences: session hijacking for SnapPublisher, unauthorized API access, and the ability to perform all actions the victim could take (view/edit creative assets, access billing details). Noting that the CSRF login step means the attack requires zero victim cooperation beyond visiting a URL strengthens the case significantly. Recommendations should be included: invalidate tokens after first use, restrict the `referrer` parameter to an explicit path allowlist, strip fragment components from the `referrer` value server-side, and add a `state` nonce to the SSO callback.

---

## The Takeaway

The core insight is that SSO token delivery is only as safe as the weakest URL the token can be redirected to — and if a trusted domain hosts user-uploaded content, an attacker who can control that content can make the trusted domain steal its own tokens.

To find similar bugs elsewhere, map every parameter that influences where an authentication token lands after a redirect. The `redirect_uri`, `referrer`, `return_to`, and `next` parameters in OAuth and SSO flows are the canonical places to start. Test whether validation is exact-match or prefix/domain-match — prefix and domain-match validators are routinely bypassed using path traversal or fragment injection. Then separately audit what the same domain allows users to upload or host: SVG, HTML, and JavaScript files are the highest-risk types because they execute in the browser context of that origin.

Tools that help: Burp Suite's Proxy and Repeater for dissecting redirect chains; browser developer tools for watching fragment behavior across redirects; a personal Google Cloud Storage or S3 bucket for hosting test payloads; and `window.location.hash` reading in a minimal SVG payload to confirm fragment delivery. Common variants of this class include open redirects in OAuth `redirect_uri` parameters that bypass redirect matching via parameter pollution, and postMessage-based token leaks where a parent frame sends a token to a child frame without validating the child's origin. Any time a token travels via URL rather than via a POST body or HTTP-only cookie, the question to ask is: what happens if the destination URL is attacker-influenced?
