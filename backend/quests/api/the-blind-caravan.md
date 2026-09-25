---
slug: "api-the-blind-caravan"
title: "The Blind Caravan"
kingdom: "api"
place: "blind-caravan"
order: 1
xp: 500
difficulty: 5
minutes: 50
requires: []
skills: ["recon", "idor", "ssrf"]
attributes: { recon: 2, exploitation: 3, logic: 2, reporting: 1 }
summary: "A black-box API and nothing else — no UI, no docs handed over. Map it, break its trust object by object and function by function, and write the assessment. The final trial of the Trade Routes."
---

You are pointed at `api.shop.example.com` and given nothing more — no interface, no documentation, no hints. This is an API assessment as it really arrives: only a host and the whole trade routes to walk on it. Map the caravan's routes, break each wall the API forgot to hold, and report by impact.

## Map the routes

An API hides its whole surface until you enumerate it. Your first move is to look for the one file that describes every route.

```question
id: spec
prompt: With only the host and no documentation, what is the single richest file to look for first, which if exposed lists every route, parameter and response of the API?
answer: the openapi spec
accept: [the openapi spec, openapi, swagger, the swagger spec, openapi.json, the api spec, the openapi/swagger spec]
hint: Try paths like /openapi.json or /swagger-ui.html.
```

The spec is exposed at `/openapi.json` and lists the whole API — including `/api/v1/orders/{id}`, `/api/v2/admin/refund`, a `/api/v1/webhooks` route, and a `/graphql` endpoint.

## Break the object wall

You register two test accounts, A and B. As A you read `/api/v1/orders/8241`; then, holding B's token, you request the same order.

```question
id: bola
prompt: Holding account B's valid token, you request account A's order at /api/v1/orders/8241 and it returns with a 200. The server checked the token but not ownership. What is this API vulnerability?
answer: BOLA
accept: [bola, broken object level authorization, idor, insecure direct object reference]
hint: Broken Object Level Authorization — the top API bug.
```

## Break the function wall

The spec listed `/api/v2/admin/refund`, an admin-only function. You call it with your ordinary user token and it issues a refund.

```question
id: bfla
prompt: Calling the admin-only /api/v2/admin/refund with a normal user's token succeeds because the server only checked the token was valid, not that you are an admin. What is this called?
answer: BFLA
accept: [bfla, broken function level authorization, forced browsing, broken function-level authorization]
hint: Broken Function Level Authorization.
```

## Load the manifest

Updating your profile, you add fields the form never showed — a role of admin and a credit balance — and the server saves them onto your account.

```question
id: mass-assignment
prompt: Adding role and credit fields to a profile-update request, which the server binds straight onto your account, is which vulnerability?
answer: mass assignment
accept: [mass assignment, bopla, broken object property level authorization, auto-binding]
hint: The server mass-assigns your whole body onto the object.
```

## Turn a feature outward's keys inward

The `/api/v1/webhooks` route lets you register a URL the server will fetch. You point it at the cloud metadata service.

```question
id: ssrf
prompt: Registering a webhook URL of http://169.254.169.254/latest/meta-data/ makes the server fetch it and return live IAM credentials. What vulnerability turned the webhook into cloud compromise?
answer: SSRF
accept: [ssrf, server-side request forgery, server side request forgery]
hint: You made the server request an internal address it trusts.
```

## Find the door they forgot

You notice the spec is for v2, but v1 endpoints still answer. The `/api/v1/orders/{id}` you already broke is on the old version, which never received v2's fixes.

```question
id: inventory
prompt: The company documents v2 but a forgotten, unpatched v1 is still deployed and answering. What is this class of "APIs the company lost track of" called?
answer: improper inventory management
accept: [improper inventory management, improper assets management, shadow apis, inventory management, improper asset management]
hint: They lost track of their own inventory of APIs.
```

## Ask the graph to describe itself

The `/graphql` endpoint has one query enabled that returns its entire schema, naming a `resetPasswordForAny` mutation.

```question
id: introspection
prompt: A single query to /graphql returns the whole schema, including an undocumented resetPasswordForAny mutation. What GraphQL feature exposed the full schema?
answer: introspection
accept: [introspection, graphql introspection, schema introspection]
hint: The graph introspects and returns its own map.
```

## Report by impact

You hold BOLA, BFLA, mass assignment to admin, an SSRF returning cloud keys, and a password-reset mutation for any user. You must lead the report with the finding of greatest real impact, and hold it all until the vendor fixes.

```question
id: lead
prompt: Between a minor over-fetch and the SSRF that returns live cloud credentials granting access to the whole infrastructure, which finding do you lead the assessment with?
answer: the SSRF
accept: [the ssrf, ssrf, the cloud credentials, the cloud keys, the one returning cloud credentials]
hint: Lead with the greatest demonstrated impact.
```

> A host and nothing else, walked end to end: you found the spec, broke object and function walls, loaded the manifest with a role, turned a webhook into the cloud's keys, dug up the version they forgot, and made the graph draw its own map — then reported by impact and disclosed responsibly. The Trade Routes are behind you.
