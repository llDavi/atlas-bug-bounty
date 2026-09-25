---
slug: "api-the-crate-that-wasnt-yours"
title: "The Crate That Wasn't Yours"
kingdom: "api"
place: "numbered-crates"
order: 1
xp: 260
difficulty: 3
minutes: 35
requires: []
skills: ["idor"]
attributes: { exploitation: 3, logic: 1 }
summary: "The single most reported API bug: an object id in the request that the server never checks belongs to you. On an API, with no UI to hide the ids, it is everywhere."
---

Every crate on the trade routes is numbered, and the number is in your request. **BOLA** — Broken Object Level Authorization, the API name for IDOR — is the most reported API vulnerability in the world, because APIs expose object ids everywhere and forget to check ownership on almost all of them. You met it in the Web Realm; here it is the main event.

## The number you change

You are logged in and read your own order:

```
GET /api/v1/orders/8241
Authorization: Bearer <your token>
->  200  {"id":8241,"buyer":"you","total":49}
```

Change `8241` to `8242` and another customer's order returns with a clean 200. Your token was valid; the server simply never checked that order `8242` was yours. That gap is BOLA, and it is worth testing on every single object-bearing endpoint.

```question
id: bola
prompt: Changing /api/v1/orders/8241 to 8242 returns another customer's order with your valid token, because the server checked authentication but not ownership. What is this API vulnerability called (its API-specific name)?
answer: BOLA
accept: [bola, broken object level authorization, idor, insecure direct object reference, broken object-level authorization]
hint: Broken Object Level Authorization — the API name for IDOR.
```

## The ids that are not sequential

APIs "fix" BOLA by using non-guessable ids — UUIDs, hashes, or the email as the key. But unguessable is not authorized: the id leaks in another endpoint's response, a shared link, a `GET /api/v1/users` list, or the JWT itself. Once you have the id from anywhere, the missing check is still missing.

```question
id: uuid-leak
prompt: An API uses random UUIDs for object ids so you cannot guess another user's, but the UUID for every user is returned in the public /api/v1/users listing. Is the BOLA fixed, or just dependent on where the id leaks?
answer: not fixed
accept: [not fixed, still vulnerable, just harder, it leaks the id, dependent on the leak, still an idor, only harder]
hint: The server still never checks ownership; you just needed the id, and it was handed to you.
```

## Ids in every position

On an API the object id hides in more than the path. Test each one:

```
/api/v1/users/1024/cards         (path)
/api/v1/export?account=552       (query)
{"transfer_to": 552}             (body)
Authorization: Bearer <jwt sub=1024>   (a sub you can tamper if unsigned)
X-Customer-Id: 552               (header)
```

The mechanical discipline that finds most BOLA: two accounts. Do an action as account A, capture the request, and replay it from account B by swapping only the id — if B gets A's data, you have it.

```question
id: two-accounts
prompt: What is the most reliable practical method to confirm a BOLA — using how many accounts, and doing what with the id?
answer: two accounts, swap the id
accept: [two accounts and swap the id, use two accounts, two accounts swapping ids, log in as two users and swap the id, with two accounts, a and b, swap the object id]
hint: One account's request, replayed from another account, changing only the object reference.
```

## The write side, again

As in the Web Realm, the severe BOLA is on the write verbs. `PATCH /api/v1/users/1025 {"email":...}` or `DELETE /api/v1/posts/999` against objects you do not own turns a data leak into account takeover or destruction.

```question
id: bola-write
prompt: You find you can not only read but also send PATCH /api/v1/users/1025 with a new email for a user who is not you. Why is this worse than a read-only BOLA?
answer: it changes their account
accept: [it modifies their data, account takeover, you can change their account, it lets you write, you can overwrite the victim, write access, it alters their account]
hint: A read leaks; a write takes over.
```

> BOLA is the trade routes' defining bug: a numbered crate whose number you control and whose owner nobody verifies. Find every object id in every position, confirm with two accounts and a single swapped value, and give the write endpoints the same test — most of the biggest API payouts are exactly this.
