---
slug: "the-nameless-city"
title: "The Nameless City"
kingdom: "web"
place: "forbidden-dungeon"
order: 1
xp: 500
difficulty: 5
minutes: 50
requires: []
skills: ["recon", "idor", "ssrf", "auth"]
attributes: { recon: 2, exploitation: 3, logic: 2, reporting: 1 }
summary: "No hints. One unknown application, walked end to end — recon, discovery, exploitation, impact, report — using everything the realm taught. The final trial of the Web Realm."
---

You are given one name — `shop.example.com` — and nothing else. No writeup, no vulnerable-by-design labels, no hint of where it breaks. This is the hunt as it really is: you walk the whole realm on one target, and each decision below is the decision you would make on a live program. Recon, discovery, investigation, exploitation, impact, report. Answer as the hunter you now are.

## Recon

You have only the apex domain. The application links to almost nothing. Your first move is silent and finds the hosts nobody advertised.

```question
id: first-move
prompt: Given only shop.example.com and no links, what is the best first passive source to discover subdomains the app never published — the one that logs every TLS certificate ever issued?
answer: certificate transparency
accept: [certificate transparency, ct logs, crt.sh, cert transparency, certificate transparency logs]
hint: Every issued certificate is public; query it for the domain.
```

That source returns `dashboard-staging.shop.example.com`, on nobody's sitemap. It answers 200 with a login form — a staging box, usually built fast and guarded least.

## Discovery

You log into staging with a test account and pull its `main.js`. Reading the bundle turns up a call the interface never makes: `POST /api/v2/admin/users`.

```question
id: js-find
prompt: The staging app's main.js contains a call to /api/v2/admin/users that no button triggers. What did reading the JavaScript hand you?
answer: a hidden endpoint
accept: [a hidden endpoint, hidden endpoint, an admin endpoint, an undocumented endpoint, a new endpoint]
hint: The client ships the route even when it hides the button.
```

## Investigation and exploitation

Your login returned a JWT. You decode its payload and it reads role user. You send your ordinary token to `/api/v2/admin/users` — and it returns 200 with the full user list. The server checked your token was valid but never that you were an admin.

```question
id: authz
prompt: With a role-user token you call the admin-only /api/v2/admin/users and it returns all users, because the server verified the token was valid but not that you hold the admin role. What class of flaw is that?
answer: broken function level authorization
accept: [broken function level authorization, forced browsing, bfla, function level authorization, missing function level access control, privilege escalation, broken access control]
hint: The privileged function ran for a non-privileged token.
```

That list shows the CEO as user id 1. On a *non-admin* endpoint, `/api/v2/users/1`, you send your token and it returns the CEO's full profile — an id you do not own, unchecked.

```question
id: idor
prompt: The endpoint /api/v2/users/1 returns the CEO's profile to your ordinary account just because 1 is in the URL. What vulnerability is that?
answer: IDOR
accept: [idor, insecure direct object reference, bola, broken object level authorization]
hint: A client-controlled object id with no ownership check.
```

The profile has a "bio" field the app renders on a public page without escaping. You set your own bio to a script that steals the session, and every visitor to your profile — including staff — runs it.

```question
id: xss
prompt: You put a script in your profile bio; the app saves it and runs it in the browser of everyone who later views your profile, staff included. Because it is saved and served to others rather than delivered by a link, which kind of XSS is it?
answer: stored
accept: [stored, stored xss, persistent xss]
hint: The app stored your payload and serves it to every viewer.
```

You also test the password reset. The reset link in the email is built from the request's Host header, so you set it to your own server and the victim's reset token is delivered to you.

```question
id: reset
prompt: The password-reset email builds its link from the request's Host header, so changing the Host sends the victim's reset token to your server. Which header did the app wrongly trust?
answer: Host
accept: [host, the host header, host header]
hint: The link's domain came from the request, not a fixed value.
```

Finally, an "import products from URL" feature fetches whatever address you supply. You point it at the cloud metadata service and it returns the machine's IAM credentials.

```question
id: ssrf
prompt: The import-from-URL feature fetches 169.254.169.254/latest/meta-data/ and returns live IAM keys. What vulnerability turned that feature into cloud account compromise?
answer: SSRF
accept: [ssrf, server-side request forgery, server side request forgery]
hint: You made the server fetch an internal address it trusts.
```

## Impact and report

You now hold a chain: staging exposure, broken authorization, IDOR on the CEO, stored XSS on staff, reset-token theft, and an SSRF returning live cloud keys. You write it up. You must lead with the finding that shows the greatest real impact.

```question
id: lead
prompt: Choosing what to lead your report with, between a minor self-only reflection and the SSRF that returns live cloud credentials granting access to the whole infrastructure, which finding leads?
answer: the SSRF
accept: [the ssrf, ssrf, the cloud credentials, the cloud keys, the ssrf to cloud keys, the one returning cloud credentials]
hint: Lead with the greatest demonstrated impact.
```

And before any public word, you hold the details until the vendor has fixed them.

```question
id: disclosure
prompt: You are excited to publish the whole chain, but the fixes are not out yet. Keeping the details private until the vendor remediates is which principle?
answer: responsible disclosure
accept: [responsible disclosure, coordinated disclosure, responsible/coordinated disclosure]
hint: The vendor gets time to fix before the world learns how.
```

> You were given a name and nothing else, and you walked it end to end: found the host nobody linked, read the code they shipped, climbed from user to admin, reached the CEO, ran code in staff browsers, stole a reset, and turned a feature into the keys to their cloud — then reported it by impact and held it responsibly. That is the whole realm, on one unknown target. The Web Realm is behind you.
