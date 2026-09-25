---
slug: "api-bfla-and-the-tenant-wall"
title: "BFLA and the Tenant Wall"
kingdom: "api"
place: "numbered-crates"
order: 2
xp: 260
difficulty: 3
minutes: 35
requires: []
skills: ["idor"]
attributes: { exploitation: 2, logic: 2 }
summary: "Beyond the object lies the function only admins should call and the wall between one company's data and the next. Both are enforced by a check the API forgot on the route that mattered."
---

Object-level authorization guards *which crate* you may open. Two other walls guard *which levers* you may pull and *whose warehouse* you are in. **BFLA** — Broken Function Level Authorization — is reaching admin functions as a normal user; broken **tenant isolation** is crossing from your company's data into another's. Both are the same missing check, on the endpoint where it counted.

## The lever only admins should pull

You discovered `/api/v1/admin/users` in recon. It is not about an object you own — it is a *function* reserved for admins. Call it with your ordinary token:

```
POST /api/v1/admin/users/1024/promote
Authorization: Bearer <ordinary user token>
->  200  {"role":"admin"}
```

If the server checks the token is valid but not that it belongs to an admin, the function runs. That is BFLA, and the pattern is broader: any endpoint whose *action* is privileged (ban, refund, export-all, impersonate) must check role, and often does not.

```question
id: bfla
prompt: Calling POST /api/v1/admin/users/1024/promote with a normal user's token succeeds because the server only verified the token was valid, not that the user is an admin. What is this API vulnerability called?
answer: BFLA
accept: [bfla, broken function level authorization, broken function-level authorization, forced browsing, function level authorization]
hint: Broken Function Level Authorization — the privileged function ran for a non-privileged token.
```

## Reading the method as the privilege

A subtle BFLA: the same path may allow different verbs to different roles. `GET /api/v1/users/1024` is fine for you, but `DELETE /api/v1/users/1024` should be admin-only — and the server guards the GET while forgetting the DELETE. Test every method on a route, not just the one the UI uses.

```question
id: method-privilege
prompt: On /api/v1/users/1024 a GET works for you, but you find DELETE also works for you though it should be admin-only. What must you test on each route to catch this, not just the verb the app uses?
answer: every method
accept: [every method, all the http methods, each verb, every verb, all methods, the other methods]
hint: The guard may sit on one method and not the others.
```

## The wall between tenants

Multi-tenant APIs (each company a separate workspace) scope data by an org or tenant id. If that id is a value *you send* and the server trusts it, you walk into another company's warehouse:

```
GET /api/v1/reports
X-Org-Id: 552          ->  change to 553: another company's reports
```

Or the org is in a JWT claim, or the object id simply is not scoped to your org at all — a BOLA that crosses tenants, the most severe kind because it breaches every customer at once.

```question
id: tenant
prompt: A SaaS API returns your company's reports based on an X-Org-Id header you send. Changing it to another company's id returns their reports. Which isolation did the server fail to enforce?
answer: tenant isolation
accept: [tenant isolation, multi-tenant isolation, org isolation, the tenant boundary, workspace isolation, cross-tenant isolation]
hint: One company's data must be walled off from every other's.
```

## Why APIs fail this so often

The reason is worth internalising: an API endpoint sees only a token and some ids, with no session and no page to carry context. So every check — is this your object, are you this role, are you in this tenant — must be written explicitly on every route, and "explicitly on every route" is exactly what tired developers skip.

```question
id: why
prompt: Object-level, function-level and tenant checks all fail constantly on APIs for the same structural reason. What is it?
answer: each check must be written on every endpoint
accept: [each endpoint must check it explicitly, the check must be repeated on every route, no shared session so each route must check, per-endpoint enforcement, every route must enforce it itself, it must be coded on each endpoint]
hint: There is no shared session doing it once; every route must enforce it itself.
```

> The crate, the lever, the warehouse — three walls, one missing check. Call the admin function with a plain token, try every method on a route, and swap the tenant id. Because an API must re-enforce authorization on every endpoint by hand, the one where it forgot is always somewhere on the map.
