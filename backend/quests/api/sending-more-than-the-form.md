---
slug: "api-sending-more-than-the-form"
title: "Sending More Than the Form"
kingdom: "api"
place: "overfull-manifest"
order: 1
xp: 260
difficulty: 3
minutes: 35
requires: []
skills: ["logic"]
attributes: { exploitation: 2, logic: 2 }
summary: "The manifest lists three items; you load a fourth. Mass assignment lets you set fields the form never offered — role, balance, verified — because the API binds your whole JSON straight onto the object."
---

An API takes your JSON and binds it onto a server-side object. If it binds *every* field you send — not just the ones the form meant — you can set properties the interface never exposed. **Mass assignment** (BOPLA, Broken Object Property Level Authorization) is loading the manifest with items nobody offered you, and the server dutifully storing them.

## The field the form never showed

A profile update legitimately sends two fields. You send four:

```
PATCH /api/v1/users/me
{
  "displayName": "alice",
  "bio": "hunter",
  "role": "admin",
  "email_verified": true
}
```

If the server binds the whole body onto the user record without an allow-list, you are now an admin with a verified email. The tell is that it *worked* — the extra fields were saved. You discover the field names from the API's own responses (the object it returns has `role`, so try setting `role`) or from the spec.

```question
id: mass-assignment
prompt: A profile update normally sends displayName and bio, but adding role admin and email_verified true to the JSON causes the server to save them onto your account. What is this vulnerability called?
answer: mass assignment
accept: [mass assignment, bopla, broken object property level authorization, auto-binding, object property level authorization]
hint: The server mass-assigns your whole body onto the object.
```

## Where the field names come from

You are not guessing blind. The response object tells you the fields — if `GET /users/me` returns `"is_premium": false`, try `PATCH`-ing `"is_premium": true`. The OpenAPI spec lists them all. And developers' internal fields (`isAdmin`, `credit`, `approved`, `account_status`) follow predictable names.

```question
id: field-source
prompt: You want to know which hidden fields to try setting via mass assignment. What is the best source for the exact field names the object has?
answer: the API's own response
accept: [the response object, the api response, the get response, the fields it returns, the openapi spec, the object it returns, reading the response, the response body]
hint: The object the API returns to you names its own properties.
```

## Two values for one field

**Parameter pollution** sends the same field twice, and different components of the stack may read a different copy. One server reads the first `amount`, a downstream check reads the second — so you pass validation with one value and act on another:

```
{"amount": 10, "amount": 10000}
```

or, in a query string, `?role=user&role=admin`. The bug is a disagreement between two parsers about which duplicate wins.

```question
id: pollution
prompt: You send the same parameter twice with different values, and a validation layer reads one copy while the action reads the other. What is this technique called?
answer: parameter pollution
accept: [parameter pollution, http parameter pollution, hpp, param pollution, duplicate parameters]
hint: You pollute the request with a duplicate parameter.
```

## The number that should not be negative, again

APIs inherit every business-logic flaw from the Web Realm, and mass assignment supercharges them: set your own `balance`, send a negative `quantity`, assign yourself a `discount` field. Improper validation on the *type and range* of a field — a string where a number is expected, a negative where positive was assumed — is the same blindness, now one JSON field away.

```question
id: validation
prompt: Through mass assignment you set a balance field directly to 999999, and through a negative quantity you make a total go below zero. Both work because the API failed to do what to the values it received?
answer: validate them
accept: [validate them, validate the input, check the range, validate type and range, proper validation, check the values, validate the fields]
hint: It accepted values it should have rejected by type and by range.
```

> The manifest is only a suggestion to an API that binds whatever you send. Read the object's own fields, add the ones the form never offered, pollute with duplicates where two parsers disagree, and push every value past the range the developer assumed. On an API, the extra item you load onto the cart is often a role.
