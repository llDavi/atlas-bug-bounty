---
slug: "api-keys-and-tokens"
title: "Keys and Tokens"
kingdom: "api"
place: "sealed-passes"
order: 1
xp: 240
difficulty: 2
minutes: 30
requires: []
skills: ["auth"]
attributes: { exploitation: 2, logic: 1 }
summary: "APIs prove who you are with a key or a token, and both leak in ways a session cookie never does — in the URL, in a repo, in a token that outlives its purpose."
---

An API has no login session in the browser sense; each request carries its own proof — an API key or a bearer token. Because that proof travels on every call, it leaks in places a cookie never would, and because it is often long-lived and broadly scoped, a leaked one is a skeleton key.

## The key in the URL

The worst-but-common pattern is the key in the query string:

```
GET /api/v1/data?api_key=sk_live_51H8qL2eZvKf
```

A key there is written into server logs, browser history, and — through the `Referer` header — handed to every third-party the page loads. A token that should be secret ends up in analytics and access logs everywhere. Keys belong in a header (`Authorization`), never the URL.

```question
id: key-in-url
prompt: An API accepts its key as a query parameter like ?api_key=sk_live_.... Beyond server logs, name one way that placement leaks the key to third parties.
answer: the referer header
accept: [the referer header, referer, referrer, browser history, the referrer header, via referer, it leaks in referer]
hint: The full URL, key included, is sent to other sites the page contacts.
```

## Bearer tokens and their scope

The modern pattern is a bearer token in a header:

```
Authorization: Bearer eyJhbGciOiJIUzI1Ni...
```

A token is issued with a **scope** — what it may do — but the server must actually enforce it. A token scoped `read:profile` that the server accepts on `POST /api/v1/transfer` is broken scope enforcement. Always take a low-privilege token and point it at a high-privilege action.

```question
id: scope
prompt: You are issued a token scoped only to read your profile, but the server accepts it on a money-transfer endpoint and performs the transfer. What did the server fail to enforce?
answer: the token scope
accept: [the scope, the token scope, scope enforcement, the token's scope, scope restrictions, authorization scope]
hint: The token said read-only; the server let it write.
```

## The key that lives forever, in a repo

API keys are frequently static — they never expire — so a key leaked once works until a human notices. And they leak constantly into public **GitHub** repos, mobile app bundles, and JavaScript. A hunter greps the target's org repos and the app's code for `sk_live_`, `AKIA` (AWS), `AIza` (Google), `ghp_` (GitHub) and similar prefixes.

```question
id: leaked-key
prompt: Searching a target's public GitHub and app bundle, you find a string beginning AKIA committed months ago. What kind of credential is that, and why is a committed static key so dangerous?
answer: an AWS access key
accept: [aws key, aws access key, an aws key, an access key, aws credentials, a static aws key]
hint: The AKIA prefix marks an AWS access key id; static keys work until revoked.
```

## No token at all

The simplest test: remove the proof entirely. Delete the `Authorization` header, or send `Authorization: Bearer null`, or an empty token — and see if the endpoint answers anyway. Endpoints that never actually required authentication are found by simply not sending any.

```question
id: no-token
prompt: You remove the Authorization header from a request completely, and the endpoint still returns the protected data. What has that one test just proven about the endpoint?
answer: it requires no authentication
accept: [it needs no auth, no authentication is required, it does not check auth, authentication is not enforced, it never required a token, broken authentication]
hint: If it answers with no token, it never checked for one.
```

> The API's proof of identity rides every request, so it leaks — in the URL, the referer, a public repo, a static key that never dies. Move keys out of URLs in your mind's checklist, test whether scope is enforced, hunt leaked keys by their prefixes, and always try sending no token at all.
