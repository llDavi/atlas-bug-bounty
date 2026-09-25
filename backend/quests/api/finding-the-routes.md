---
slug: "api-finding-the-routes"
title: "Finding the Routes"
kingdom: "api"
place: "mapping-routes"
order: 1
xp: 220
difficulty: 2
minutes: 30
requires: []
skills: ["recon"]
attributes: { recon: 3, logic: 1 }
summary: "You cannot test an endpoint you never found. APIs hand you their own route lists — in a Swagger doc, in the JavaScript, in an old response — if you know where to look."
---

An API has no menu to click, so the whole surface is invisible until you enumerate it. The good news: APIs are built to be consumed, so they document themselves more than any website — in specification files, in client code, in the archive. The hunter with the fuller route list wins, because every route the others missed is untested.

## The specification, served up

Modern APIs ship a machine-readable spec — OpenAPI (Swagger). When the docs UI is exposed, it lists every endpoint, parameter and expected response:

```
/swagger-ui.html      /swagger.json      /openapi.json
/api-docs             /v2/api-docs       /redoc
```

One of those often returns the entire API definition — including admin and internal routes the developers never meant to publish. It is the single richest recon find on an API.

```question
id: swagger
prompt: An endpoint at /openapi.json returns a document describing every route, parameter and response of the API, including internal ones. What is this kind of machine-readable API specification generally called?
answer: OpenAPI
accept: [openapi, swagger, openapi spec, swagger spec, an openapi specification, openapi/swagger]
hint: Its interactive viewer is usually called Swagger UI.
```

## The client already knows the routes

When there is no spec, the front-end has the list — a mobile app or SPA must know every endpoint it calls. Pull the JavaScript bundle (or decompile the mobile app) and extract the paths, exactly as in the Web Realm:

```
grep -oE '/api/v[0-9]+/[a-zA-Z0-9/_-]+' main.js | sort -u
/api/v1/users
/api/v1/users/{id}/impersonate
/api/v2/internal/reports
```

`impersonate` and `internal/reports` are handed to you by the code that calls them.

```question
id: js-routes
prompt: An API has no public spec, but its single-page-app front-end must call every endpoint it uses. Where do you extract the route list from in that case?
answer: the JavaScript
accept: [the javascript, the js bundle, main.js, the frontend code, the client code, the js, the bundle]
hint: The client cannot call a route it does not contain.
```

## The routes that used to exist

`gau` and `waybackurls` from the Web Realm recover old API paths the archive recorded, and Postman's public collections and GitHub often leak internal endpoints a company published by accident. A retired `/api/v1/legacy/exportAll` from three years ago may still answer.

```question
id: archive
prompt: Beyond a spec and the JavaScript, name one place a hunter mines for API endpoints that a company published or leaked in the past.
answer: the wayback machine
accept: [the wayback machine, waybackurls, gau, the web archive, github, postman collections, the archive, public postman, google dorks]
hint: The internet keeps a history of URLs long after they are unlinked.
```

## Guessing the ones nobody wrote down

REST is predictable, so once you know `/api/v1/users/{id}`, you guess siblings: `/orders`, `/invoices`, `/admin/users`, `/users/{id}/roles`. Fuzz path segments with an API-flavoured wordlist and watch for a `200`, `401` or `403` that betrays a route exists.

```question
id: guess
prompt: Knowing REST endpoints are regular, after finding /api/v1/users/{id} you fuzz for siblings and one returns 401 instead of 404. What does a 401 (rather than 404) on a guessed path tell you?
answer: the endpoint exists
accept: [the endpoint exists, that route exists, it exists but needs auth, the route is real, it exists, that path exists but is protected]
hint: 404 means no such route; 401 means the route is there but wants credentials.
```

> The API's surface is only invisible until you enumerate it. Ask for the spec, read the routes out of the client, mine the archive for the retired ones, and guess the regular siblings — then test everything the developers thought no one would find.
