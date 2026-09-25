---
slug: "the-warded-mirror"
title: "The Warded Mirror"
kingdom: "web"
place: "hall-of-mirrors"
order: 3
xp: 260
difficulty: 3
minutes: 35
requires: []
skills: ["xss", "open-redirect"]
attributes: { exploitation: 2, logic: 1 }
summary: "The defences and the smaller client-side bugs: a Content-Security-Policy that only pretends to help, the redirect that trusts your parameter, and the invisible frame."
---

Around the mirror sit the wards — and the wards are often as flawed as the glass. A **Content-Security-Policy** meant to stop XSS may permit it; a redirect meant to be convenient sends victims to the attacker; a page that can be framed can be clicked through. These are the client-side bugs that ride alongside XSS in real reports.

## CSP: the ward that may not hold

A CSP tells the browser which scripts are allowed to run, so that even reflected input cannot execute. But a policy is only as strong as its weakest source. Read this real one:

```http
Content-Security-Policy: script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net
```

`'unsafe-inline'` allows inline `<script>` and `onerror=` handlers — which is exactly what XSS uses, so this CSP stops nothing. Even without it, a whitelisted host that serves arbitrary JavaScript (a public CDN, a JSONP endpoint) is a way to run your code from an "allowed" origin.

```question
id: csp-unsafe
prompt: A page ships a CSP of script-src 'self' 'unsafe-inline'. Your reflected onerror handler still runs. Which keyword in that policy makes the CSP useless against inline-script XSS?
answer: unsafe-inline
accept: [unsafe-inline, 'unsafe-inline', the unsafe-inline directive]
hint: It explicitly permits the inline handlers XSS relies on.
```

```question
id: csp-bypass
prompt: A stricter CSP allows scripts only from 'self' and a public CDN that will serve any JavaScript you upload or reference. How can that whitelisted CDN still let you run your code?
answer: load your script from the CDN
accept: [host your script on the cdn, serve your js from the allowed cdn, the cdn serves arbitrary js, use the whitelisted cdn, load it from the allowed host, jsonp on the cdn]
hint: The policy trusts the host, and the host will serve whatever you point it at.
```

## The redirect that trusts you

A `?next=` or `?returnTo=` parameter that sends you onward after login is an **open redirect** when it is not validated against a fixed list:

```
https://target.com/login?next=https://evil.attacker.com
```

Alone it is low severity, but it is a force multiplier: it makes phishing links look legitimate (they start on the real domain), and it is the piece that turns a loose OAuth `redirect_uri` or an SSRF into a full exploit by bouncing the request onward.

```question
id: open-redirect
prompt: A next parameter forwards the user to any URL after login, including https://evil.attacker.com, with no check against an allow-list. What is this bug called?
answer: open redirect
accept: [open redirect, an open redirect, unvalidated redirect]
hint: The app redirects anywhere the parameter says, unchecked.
```

## The invisible frame

If a sensitive page can be loaded in an `<iframe>` on the attacker's site, the attacker can make it transparent, float a fake button under the victim's cursor, and have them click a real action (delete account, transfer, "authorise") without knowing. The defence is refusing to be framed — a `X-Frame-Options: DENY` or a CSP `frame-ancestors 'none'`. Its absence is **clickjacking**.

```question
id: clickjacking
prompt: A money-transfer page sets no X-Frame-Options and no frame-ancestors, so an attacker frames it invisibly and tricks the victim into clicking the real transfer button. What is this attack called?
answer: clickjacking
accept: [clickjacking, click-jacking, ui redressing]
hint: The victim clicks a real button hidden under a fake one.
```

> The wards fail in their own ways: a CSP that whitelists the very thing XSS needs, a redirect that trusts an unchecked parameter, a page that forgot to refuse framing. Read the policy for its weakest source, test every next parameter, and check whether the sensitive page can be framed — the defences are as worth auditing as the glass they guard.
