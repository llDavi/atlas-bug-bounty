---
slug: "api-the-schema-speaks"
title: "The Schema Speaks"
kingdom: "api"
place: "web-of-roads"
order: 1
xp: 240
difficulty: 2
minutes: 30
requires: []
skills: ["recon"]
attributes: { recon: 3, logic: 1 }
summary: "One endpoint, one language, and a built-in command that returns the entire map. GraphQL trades a hundred REST routes for a single graph that will describe itself if you ask."
---

GraphQL replaces a hundred REST endpoints with one — usually `/graphql` — that speaks a query language: you ask for exactly the fields you want and get exactly those back. For a hunter its defining feature is that the schema is the API, and the API will hand you the schema on request. Learn to read the graph and it draws its own map.

## One door, two kinds of request

Everything goes to the single endpoint as a POST. A **query** reads; a **mutation** writes. The names are the actions:

```
POST /graphql
{"query": "{ user(id: 1024) { name email } }"}          # a query: read

{"query": "mutation { deleteUser(id: 1024) }"}          # a mutation: write
```

So the first recon question on any GraphQL endpoint is: what queries and mutations exist? A `deleteUser` or `makeAdmin` mutation is as good as a hidden admin endpoint.

```question
id: mutation
prompt: In GraphQL, a request that reads data is a query. What is the name for a request that changes data — creating, updating, or deleting?
answer: mutation
accept: [mutation, a mutation, mutations]
hint: It mutates state.
```

## The schema, on demand

GraphQL has a built-in **introspection** query that returns the entire schema — every type, field, argument, query and mutation:

```
{"query": "{ __schema { queryType { name } mutationType { fields { name } } } }"}
->  mutationType: [ createUser, deleteUser, resetPasswordForAny, exportAllData ]
```

`resetPasswordForAny` and `exportAllData` were never in any documentation; introspection named them. When introspection is enabled, you hold the complete API in one request; tools like GraphQL Voyager draw it as a map.

```question
id: introspection
prompt: A single query to a GraphQL endpoint returns every type, field and mutation it supports, including undocumented ones like exportAllData. What is this self-describing feature called?
answer: introspection
accept: [introspection, graphql introspection, schema introspection]
hint: The graph introspects and returns its own schema.
```

## When the map is hidden

Mature targets disable introspection. That does not mean blind: field names can be **guessed** (GraphQL suggests corrections — "did you mean `email`?" — leaking valid fields), recovered from the JavaScript, or pulled from saved queries. A disabled introspection is a speed bump, not a wall.

```question
id: suggestions
prompt: Introspection is disabled, but when you query a slightly-wrong field name the endpoint replies "Did you mean email?". What does that error message leak that helps you rebuild the schema by hand?
answer: valid field names
accept: [valid field names, real field names, the correct field names, existing fields, field names, the actual fields]
hint: Its helpful correction confirms which fields actually exist.
```

## Asking for everything at once

Because you choose the shape, one query reaches deep and wide: `user { orders { items payment { card } } }` pulls a whole object graph in a single call. That power is also the risk — it is how a single query over-fetches sensitive nested data, and how authorization gets skipped on the fields reached *through* an object rather than requested directly, the subject of the next lesson.

```question
id: nesting
prompt: A GraphQL query lets you ask for user then nested orders then payment then card in one request. What does this ability to reach deeply nested fields in a single query make it easy to accidentally do — over-fetch, and skip checks on nested fields?
answer: reach unauthorized nested data
accept: [over-fetch nested data, reach nested fields without checks, access nested fields, pull deeply nested data, over-fetch, reach data through nested objects, skip checks on nested fields]
hint: The check may sit on the top object, not the ones reached through it.
```

> GraphQL is one endpoint that will draw you its own map. Ask introspection for the whole schema, and when it is disabled, coax the field names out of its error messages and its client. Find the mutations that write, note the deep nesting you can reach — and then break it, next.
