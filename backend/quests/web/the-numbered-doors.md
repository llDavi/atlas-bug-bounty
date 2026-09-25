---
slug: "the-numbered-doors"
title: "The Numbered Doors"
kingdom: "web"
place: "broken-gate"
order: 1
xp: 260
difficulty: 3
minutes: 35
requires: []
skills: ["idor"]
attributes: { exploitation: 2, logic: 2 }
summary: "Authentication asks who you are; authorization asks what you may touch. The most reported bug in the trade is an object id the server never checked was yours."
---

The gate proved who you are. **Authorization** is a different question the app answers on *every request after*: may this user touch *this* object? When the answer is "the id was in the URL, so sure", you have found the most-reported class of bug in bounty history — **IDOR**, an insecure reference to a direct object.

## The id that was never yours

You are logged in as yourself. The app shows your invoice at:

```http
GET /api/v1/invoices/40021 HTTP/1.1
Authorization: Bearer <your token>
```

The `40021` came from the URL, chosen by the client. The server checked your token was *valid* — but never checked invoice `40021` *belongs to you*. Change it to `40022` in Repeater and another company's invoice comes back with a clean `200`. That gap — authenticated, but not authorized for the object — is the whole bug.

```question
id: idor-core
prompt: Logged in as yourself, you change /invoices/40021 to /invoices/40022 and receive a different customer's invoice with a 200. Your token was valid the whole time. Which check did the server skip?
answer: that the object belongs to you
accept: [ownership, object ownership, authorization, that you own the object, whether it is yours, an authorization check, ownership check]
hint: It verified who you are, never what you may see.
```

## Where the ids hide

Ids are not only in the path. Hunt them everywhere the client sends a value the server might trust:

```
/api/users/1024/settings          (path)
/download?doc_id=8813              (query)
{"account_id": 552, "amount": 10} (JSON body)
Cookie: cart=cart_9931            (cookie)
X-Account-Id: 552                 (header)
```

Every one is a candidate. The method is dull and effective: change the id, resend, and see if you get someone else's data — or, worse, change *their* data.

```question
id: id-locations
prompt: You have tested the id in the URL path. Name one other place in the same request where a client-controlled object id might sit and be worth tampering.
answer: the body
accept: [query string, the query, request body, json body, a cookie, a header, query parameter, post body, the json]
hint: The path is only one field the client controls.
```

## Guessable, and not

`40021 -> 40022` is easy because ids are sequential. Apps "fix" IDOR by switching to a **UUID** like `b1e9…` — which is not guessable, but is still an IDOR if the id leaks anywhere (in a shared link, a search result, an email, another endpoint's response). Unguessable is not the same as authorized.

```question
id: uuid
prompt: An app replaces sequential ids with random UUIDs, so you cannot guess another user's object id. Is the underlying authorization flaw fixed, or merely harder to reach if the UUID ever leaks?
answer: merely harder
accept: [not fixed, still vulnerable, merely harder to reach, only harder, not really fixed, still an idor if it leaks, harder not fixed]
hint: The server still never checks ownership; you just need the id from somewhere.
```

## Reading, and writing

The dangerous IDORs are not the reads. Look for the same missing check on the endpoints that *change* things — the `PUT`, `PATCH`, `DELETE`, and the state-changing `POST`:

```http
PATCH /api/v1/users/1024 HTTP/1.1

{"email": "attacker@evil.com"}
```

Change `1024` to the victim's id, and if the server does not check ownership you have rewritten *their* email — the first step of a takeover. A read leaks data; a write takes the account.

```question
id: idor-write
prompt: You find you can send PATCH /users/1025 with a new email and change another user's account, not just read it. Compared with an IDOR that only reads data, why is this more severe?
answer: it changes their account
accept: [it modifies data, you can take over the account, account takeover, it lets you write, you can change their data, it alters the victim's account, write access]
hint: One leaks; the other lets you overwrite the victim.
```

> Authorization is checked per object, per request, and the app forgets constantly. Find every client-controlled id — in the path, the query, the body, the cookie, the header — change it, and watch whether the server ever asks *is this yours?* Most of the time it does not, and the write endpoints are where that costs the most.
