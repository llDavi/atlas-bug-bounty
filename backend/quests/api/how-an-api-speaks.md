---
slug: "api-how-an-api-speaks"
title: "How an API Speaks"
kingdom: "api"
place: "common-ledger"
order: 1
xp: 200
difficulty: 1
minutes: 25
requires: []
skills: ["http"]
attributes: { recon: 1, logic: 1 }
summary: "An API drops the pretty page and speaks in plain JSON over the same HTTP you know. The verb is the intent, the path is the object, and the reply often says more than the screen ever showed."
---

An API is a web app with the page removed. Same HTTP, same headers, same methods — but instead of HTML it answers in **JSON**, machine to machine. That is good news for a hunter: there is no UI in the way, only the raw request and the raw data. And APIs, built to be consumed by code, routinely hand back more than any screen would show.

## The verb is the intent

A REST API maps the HTTP method onto an action on a resource. The path names the object; the verb says what to do to it:

```
GET    /api/v1/orders        list orders
GET    /api/v1/orders/8241   read order 8241
POST   /api/v1/orders        create an order
PUT    /api/v1/orders/8241   replace order 8241
PATCH  /api/v1/orders/8241   modify order 8241
DELETE /api/v1/orders/8241   delete order 8241
```

That regularity is a gift: if you can `GET /orders/8241`, the same path with `DELETE` or `PATCH` may exist even though no button uses it — and the write verbs are where authorization is most often forgotten.

```question
id: verb
prompt: You can read an object with GET /api/v1/orders/8241. Which HTTP method would you try on the same path to attempt to delete that object, even if no button offers it?
answer: DELETE
accept: [delete, the delete method, http delete]
hint: REST maps the action onto the verb; this one removes the resource.
```

## The reply that overshares

A profile screen shows a name and an avatar. The API call behind it returns the whole record:

```json
GET /api/v1/users/1024
{
  "id": 1024,
  "name": "Alice",
  "email": "alice@corp.com",
  "role": "user",
  "is_verified": true,
  "password_reset_token": "a1b2c3",
  "internal_notes": "VIP - do not suspend"
}
```

The UI rendered two of those fields; the API returned seven, including a live reset token and internal notes. This is **excessive data exposure** — the API returns the full object and trusts the client to display only part of it. Always read the raw JSON, not the screen.

```question
id: oversharing
prompt: The profile page shows only a name and avatar, but the API response also contains email, a password_reset_token and internal_notes. The server returns the whole object and lets the client hide fields. What is this flaw called?
answer: excessive data exposure
accept: [excessive data exposure, over-exposure, data exposure, information disclosure, returning too much data]
hint: The API overshares and trusts the UI to trim it.
```

## The status code that confirms the write

APIs lean on status codes precisely. A `201 Created` after a POST confirms your object was made; a `200` with a body confirms a read; a `403` versus `404` on an object you should not see leaks whether it *exists*. Read the code as carefully as the body.

```question
id: created
prompt: After you POST to /api/v1/orders, the API answers 201 with the new order in the body. What does a 201 status specifically confirm happened?
answer: a resource was created
accept: [it was created, the object was created, a resource was created, creation succeeded, the order was created, created]
hint: The name of the 201 status is exactly its meaning.
```

## No page means no place to hide

Because an API has no HTML, there is no client-side rendering to obscure anything: the request is pure data you shape, and the response is pure data you read. That is why so much of API hunting is simply reading raw JSON in Repeater and asking, for each field, *should I be able to see or set this?*

```question
id: raw
prompt: Compared with a normal web page, why is an API often easier to test — what is missing that used to hide the data and the request?
answer: the UI
accept: [the ui, there is no page, no html, the rendering, the front-end, the interface, no ui in the way]
hint: There is no page rendering between you and the raw request and response.
```

> An API speaks the HTTP you already know, in plain JSON, with the verb as intent and the path as object. It hides nothing behind a page and tends to answer with the whole record. Read the raw request and the raw response, and much of the trade routes reveals itself.
