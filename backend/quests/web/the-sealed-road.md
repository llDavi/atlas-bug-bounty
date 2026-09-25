---
slug: "the-sealed-road"
title: "The Sealed Road"
kingdom: "web"
place: "wanderers-rest"
order: 3
xp: 220
difficulty: 2
minutes: 30
requires: []
skills: ["auth", "http"]
attributes: { logic: 2, recon: 1 }
summary: "The house forgets you between slips. How it remembers — a cookie, a token, a seal — decides whether you can forge being someone else."
---

The web forgets. Every request stands alone, so the house hands you something to carry back that says *this is still me* — a cookie, or a token. How that thing is sealed is the whole game. A seal you can read, copy or re-stamp is not a seal at all.

## The cookie, and the flags that guard it

Here is a real `Set-Cookie`, exactly as it comes back on login:

```http
Set-Cookie: session=eyJ1IjoxMDI0fQ; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=1209600
```

Three little words at the end decide how stealable that session is:

- **HttpOnly** — JavaScript cannot read it. Drop this flag and any script running on the page can read `document.cookie` and post it to an attacker.
- **Secure** — sent only over HTTPS. Drop it and the cookie also rides plain `http`, where anyone on the wire reads it.
- **SameSite** — whether the browser attaches it to requests *coming from other sites*.

The flag a hunter loves is the one that is missing.

```question
id: no-httponly
prompt: A session cookie comes back without the HttpOnly flag. Which vulnerability, if you also find one on the page, can now read that cookie straight out of document.cookie?
answer: XSS
accept: [cross-site scripting, reflected xss, stored xss]
hint: The bug lets you run your own JavaScript in the victim's page.
```

```question
id: no-secure
prompt: The same cookie is set without the Secure flag. Over which unencrypted protocol will the browser now also send it, where a network attacker can capture it?
answer: HTTP
accept: [plain http, http plaintext]
hint: The sibling of HTTPS, without the S.
```

```question
id: samesite
prompt: Which SameSite value lets a session cookie ride along with a request that a completely different website triggers, which is exactly what a CSRF attack needs?
answer: None
accept: [samesite none, none value]
hint: Lax and Strict both hold the cookie back; this one does not.
```

## The token you can read

Many houses stopped storing sessions and started handing out a **JWT** — a token that carries its own claims. It looks like one string, but it is three parts joined by dots. Decode the middle part of this one:

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMDI0Iiwicm9sZSI6InVzZXIifQ.4pO...
```

The header decodes to `{ alg: HS256, typ: JWT }` and the payload to `{ sub: 1024, role: user }`. That payload is **base64, not encryption** — anyone can read it, and there is a field in it worth staring at.

```question
id: jwt-readable
prompt: The middle segment of a JWT decodes to plain JSON like sub 1024 and role user. Is that payload encrypted and safe to put secrets in?
answer: no
accept: [not encrypted, it is not encrypted, no it is readable, readable]
hint: It is only base64-encoded — decode it and you read every claim.
```

```question
id: jwt-role
prompt: In that decoded payload, sub is 1024 and role is user. Which field would you flip and re-send first to test for privilege escalation?
answer: role
accept: [the role field, role claim]
hint: You want to stop being a user.
```

The dangerous seals: a server that accepts a JWT whose header says the algorithm is **none** (it dropped the signature entirely — forge any payload you like), or one signed with a weak secret you can crack offline and re-sign.

```question
id: alg-none
prompt: A server accepts a token whose header algorithm is set to none, with the signature left blank. In one word, what can you now do to any claim in the token — change its role, its user id — freely?
answer: forge
accept: [forge it, forge tokens, forge the token, token forgery, tamper]
hint: With no signature to check, nothing stops you rewriting the payload.
```

## The seal that never changes

One classic: the house gives you a session identifier *before* you log in, and does **not** change it after. If an attacker can plant a known session id in a victim's browser and the id survives login, the attacker ends up sharing the victim's authenticated session.

```question
id: fixation
prompt: You note the session id before logging in, then log in, and the id is identical afterwards — the house never rotated it. Which session vulnerability is that?
answer: session fixation
accept: [fixation]
hint: The attacker fixes the id in advance, then waits for the victim to authenticate it.
```

## The seal that leaks the map

The lock on the road — TLS — also hands you recon for free. A site's certificate lists every hostname it is valid for in its **Subject Alternative Name** block. Read one straight off the connection:

```
X509v3 Subject Alternative Name:
    DNS:target.com
    DNS:www.target.com
    DNS:api.target.com
    DNS:staging-admin.target.com
```

`staging-admin.target.com` was on nobody's sitemap. The certificate just handed it to you.

```question
id: san-recon
prompt: A live certificate's Subject Alternative Name list includes staging-admin.target.com, a host you had not seen anywhere else. What did reading the certificate just hand you?
answer: a subdomain
accept: [subdomain, a new subdomain, new subdomain, staging-admin.target.com, a new target]
hint: A hostname you can now add to your scope and go knock on.
```

> None of this needed an exploit — only reading the seal closely. A cookie without its flags, a token you can rewrite, a session id that never turns over, a certificate that lists the staging box: the web tells you how it remembers you, and half the time it tells you how to become someone else.
