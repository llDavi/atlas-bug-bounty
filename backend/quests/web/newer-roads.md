---
slug: "newer-roads"
title: "Newer Roads"
kingdom: "web"
place: "injection-marshes"
order: 1
xp: 260
difficulty: 3
minutes: 35
requires: []
skills: ["recon", "http"]
attributes: { recon: 2, logic: 1 }
summary: "GraphQL that describes its whole self on request, WebSockets that skip the checks, and the newer protocols the old habits do not cover."
---

The modern web runs on roads the classic tester never walks: a GraphQL endpoint that will hand you its entire schema, a WebSocket that authenticated once and never again, an HTTP/2 stack that behaves subtly differently underneath. Each rewards a hunter who knows the road exists.

## GraphQL: the API that documents itself

A GraphQL endpoint (usually `/graphql`) takes one query and returns exactly the fields asked for. Its gift to a hunter is **introspection** — a built-in query that returns the whole schema, every type, every field, every mutation:

```
POST /graphql   {"query":"{ __schema { types { name fields { name } } } }"}
```

If introspection is on, you now have the complete list of operations — including the `deleteUser` and `internalNotes` the UI never calls. GraphQL also often ignores rate limits (one request can ask for hundreds of objects) and hides authorization bugs behind nested fields (`user { payments { card } }`).

```question
id: introspection
prompt: Sending an introspection query to a /graphql endpoint returns its entire schema — every type, field and mutation, including ones no button uses. What is that self-describing query feature called?
answer: introspection
accept: [introspection, graphql introspection, schema introspection]
hint: The API introspects and hands you its own map.
```

```question
id: graphql-nested
prompt: A GraphQL query lets you ask for user then nested payments then card in one request. Why do authorization bugs often hide in these nested fields specifically?
answer: nested fields skip the checks
accept: [the nested object is not authorised, authorization is not checked per field, nested resolvers miss the check, the app checks the top object not the nested one, missing checks on nested fields, per-field authorization is missing]
hint: The app may authorise the top-level object but not the ones reached through it.
```

## WebSockets: authenticated once, trusted forever

A WebSocket upgrades an HTTP request into a long-lived two-way channel. The common flaw: the app checks who you are during the *handshake*, then trusts every message on the channel afterwards without re-checking. Messages carry actions —

```
{"action":"getOrder","orderId":8242}
```

— and that `orderId` is an IDOR just like any other, but testers forget to look because it is not a normal HTTP request. Burp can intercept and edit WebSocket messages exactly like requests.

```question
id: websocket
prompt: A WebSocket app authenticates during the handshake and then accepts action messages without re-checking authorization. A message contains orderId 8242. What ordinary vulnerability should you test by changing that id, even though it is a WebSocket message?
answer: IDOR
accept: [idor, authorization, insecure direct object reference, broken authorization]
hint: A client-controlled object id is an IDOR wherever it travels.
```

## The stack beneath still matters

HTTP/2 (and /3) change how requests are framed on the wire even when the site looks the same. That difference is mostly the ground for request smuggling — the next lesson — but the habit to keep is: the transport is not just decoration. How a request is *parsed* by each hop can differ, and disagreements between hops are bugs.

```question
id: http2
prompt: Two systems handling the same request — a front-end proxy and a back-end server — parse it slightly differently. In general, a disagreement between two hops about where one request ends is the seed of which class of attack, covered next?
answer: request smuggling
accept: [request smuggling, http request smuggling, smuggling]
hint: If they disagree on request boundaries, you can smuggle one inside another.
```

> The newer roads carry the same old bugs plus a few of their own. Ask GraphQL to describe itself, treat every WebSocket message as a request to tamper, and remember that the protocol under the page is where the next lesson's attacks live.
