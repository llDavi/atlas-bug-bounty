---
slug: "one-origin-many-doors"
title: "One Origin, Many Doors"
kingdom: "web"
place: "wanderers-rest"
order: 5
xp: 240
difficulty: 2
minutes: 30
requires: []
skills: ["http", "logic"]
attributes: { logic: 2, recon: 1 }
summary: "Why one site cannot read another's data — and the header a server sets to reflect an attacker's origin and hand it over anyway."
---

The web runs a thousand sites in one browser, all sharing your logged-in sessions. The only thing stopping `evil.com` from quietly reading your bank is a single rule — and the ways a server pokes holes in that rule are some of the most reliable reports in the trade.

## The rule: Same-Origin Policy

An **origin** is the triple *scheme + host + port*: `https://target.com` is a different origin from `http://target.com`, from `https://api.target.com`, from `https://target.com:8443`. The **Same-Origin Policy** says: script running on one origin may *send* a request to another (carrying your cookies), but it may **not read the response**. Your bank still gets the request; `evil.com`'s JavaScript just never sees the answer.

```question
id: sop-read
prompt: By default, script running on evil.com sends a request to bank.com with your cookies attached. Same-Origin Policy allows the request to go — but can that script read the response body that comes back?
answer: no
accept: [it cannot, no it cannot, not allowed]
hint: The request is sent; the *reading* is what is blocked.
```

## The controlled hole: CORS

A server can *choose* to let another origin read its responses, using **CORS** headers. Done wrong, it becomes the hole. Here is a real exchange. The attacker's page sends:

```http
GET /api/me HTTP/1.1
Host: api.target.com
Origin: https://evil.com
Cookie: session=9f2c1e7a...
```

and the server answers:

```http
HTTP/1.1 200 OK
Access-Control-Allow-Origin: https://evil.com
Access-Control-Allow-Credentials: true
Content-Type: application/json

{"email":"victim@target.com","apiToken":"a1b2c3..."}
```

Read what the server did: it took the attacker's own `Origin` and **reflected it straight back** as the allowed origin, *and* it set credentials to true. It has just told the browser that `evil.com` is allowed to read a logged-in victim's email and API token. That is a textbook, high-value CORS misconfiguration.

```question
id: cors-reflect
prompt: The response reflects the attacker's own origin back as the allowed origin and also allows credentials, so evil.com can read a logged-in victim's private data. Name this vulnerability class.
answer: CORS misconfiguration
accept: [cors, cors misconfig, cors misconfiguration, misconfigured cors]
hint: It is the controlled hole in Same-Origin Policy, opened too wide.
```

```question
id: acao-header
prompt: Which response header carries the origin the server is willing to let read the response — the one reflected as https://evil.com above?
answer: Access-Control-Allow-Origin
accept: [acao, access control allow origin]
hint: Three words, the first is "Access-Control".
```

A safer-looking server sets the allowed origin to the wildcard `*`. That is not a free pass, though: the browser refuses to send credentials (your cookies) when the allowed origin is `*`, so the wildcard cannot read *your logged-in* data.

```question
id: wildcard-creds
prompt: A server responds with an allowed-origin of * (the wildcard). Will the browser send the victim's cookies along and let the caller read their authenticated data?
answer: no
accept: [it will not, no it does not, credentials are blocked]
hint: Wildcard and credentials do not mix — the browser forbids it.
```

Before it even sends certain cross-origin requests — anything with a custom header like `Authorization`, or a method like `PUT` or `DELETE` — the browser first asks permission with a **preflight**.

```question
id: preflight
prompt: Before a cross-origin request that carries a custom Authorization header, the browser sends a permission-check request first. Which HTTP method does that preflight use?
answer: OPTIONS
accept: [preflight, an options request]
hint: Not GET, not POST — the method whose whole job is to ask "am I allowed to?".
```

## How modern apps are actually shaped

The React or Vue page you are looking at is **static files** — HTML, CSS, a bundle of JavaScript. It holds no secrets and enforces nothing. Every real decision happens in a separate **JSON API** the page calls with a bearer token. So the UI that renders *"You are not an administrator"* is just text; the endpoint behind the admin screen may answer your token anyway.

```http
GET /api/v1/admin/stats HTTP/1.1
Authorization: Bearer eyJ...        # your ordinary user token
```

The hunter's habit follows from the shape: stop testing the pretty page, and test the API directly in Burp — the button being hidden means nothing if the endpoint still answers.

```question
id: spa-where
prompt: In a modern single-page app the page is static and every real check lives in the JSON API it calls with a bearer token. Where do you actually test for broken authorisation — the rendered UI, or the API?
answer: the API
accept: [api, the api, the backend api, the endpoints, api directly]
hint: The hidden admin button proves nothing; the endpoint behind it might still answer.
```

> One origin cannot read another's data — until a server reflects the wrong origin, or the app hands all its authority to an API that trusts a token more than it should. Learn to read a CORS response and to ignore the UI, and two of the most common real-world reports are already in reach.
