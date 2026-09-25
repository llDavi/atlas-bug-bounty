---
slug: "api-breaking-the-graph"
title: "Breaking the Graph"
kingdom: "api"
place: "web-of-roads"
order: 2
xp: 280
difficulty: 3
minutes: 35
requires: []
skills: ["idor", "logic"]
attributes: { exploitation: 2, logic: 3 }
summary: "GraphQL's flexibility is its weakness: authorization checked per field and often skipped on nested ones, rate limits dodged by batching, and denial of service one deep query away."
---

Every strength of GraphQL is an attack surface. Authorization must be enforced on every field's resolver, so it is missed on some. One request can carry many operations, so rate limits mean little. And because you control the query's shape, you can make one request cost the server everything. Break the graph where its flexibility outran its checks.

## The check that guards the object but not the field

Authorization in GraphQL runs per **resolver** — the function behind each field. The app checks you may read `user`, but the `payments` resolver reached *through* it never re-checks. So you request another user and follow the nesting to data that should be sealed:

```
{ user(id: 999) { email payments { amount card } } }
```

If `user(id: 999)` returns and the nested `payments` come with it, you have a BOLA expressed through the graph — the top object was checked (or not), the nested field was not.

```question
id: nested-authz
prompt: You query user id 999 and the nested payments field returns their card data because that field's resolver never checked authorization. GraphQL authorization must be enforced on each what?
answer: resolver
accept: [resolver, each field resolver, per field, each field, per-resolver, every resolver, each field's resolver]
hint: Every field has its own resolver, and each must enforce the check itself.
```

## Many operations in one request

GraphQL lets you send **aliases** — the same field many times under different names — or a batch of operations in one HTTP request. That defeats per-request rate limiting: a thousand login attempts arrive as one call:

```
{ a: login(user:"admin", pass:"aaaa") b: login(user:"admin", pass:"aaab") c: ... }
```

The rate limiter counts one request; the server processed a thousand guesses. Aliasing and batching turn a throttled endpoint into an unthrottled one.

```question
id: batching
prompt: You put a thousand login attempts into one GraphQL request using aliases, and the rate limiter — which counts HTTP requests — sees only one. What GraphQL feature let you smuggle a thousand operations past a per-request limit?
answer: aliases
accept: [aliases, batching, aliasing, query batching, batching and aliases, alias batching]
hint: The same field, repeated under different names, in a single request.
```

## The query that never ends

Where types reference each other, you can nest a query into a loop the server dutifully tries to resolve, exhausting memory or time — a denial of service from one crafted query:

```
{ post { author { posts { author { posts { ... } } } } } }
```

Without a **depth or complexity limit**, that one request can take the service down. Testing for a maximum query depth is a standard GraphQL check.

```question
id: depth
prompt: A deeply recursive GraphQL query (post to author to posts to author, repeated) makes the server run until it exhausts resources. What limit should the API have set to prevent one query causing denial of service?
answer: query depth limit
accept: [depth limit, query depth limit, complexity limit, a depth or complexity limit, max depth, query complexity limit]
hint: It should cap how deep or complex a single query may be.
```

## The same injections, through arguments

Field arguments feed the same databases and systems as any API, so injection lives here too — a `filter` or `search` argument that reaches a SQL query, an `id` that reaches a lookup. The graph does not sanitise for the resolvers behind it.

```question
id: graphql-injection
prompt: A GraphQL field takes a search argument whose value is placed into a database query behind the resolver, and a quote in it causes an error. Does GraphQL being the front door make classic injection any less possible in the resolver?
answer: no
accept: [no, no it does not, injection still applies, it still applies, same as any api, no difference]
hint: The resolver talks to the same database as any other endpoint.
```

> GraphQL breaks where its flexibility outpaced its guards: authorization skipped on a nested resolver, rate limits dissolved by aliasing, the server felled by one deep query, injection riding an argument. Query another user's object and follow the nesting, batch your guesses, nest a loop, and quote an argument — the graph gives you the reach; the missing checks give you the bug.
