---
slug: "the-open-ledger"
title: "The Open Ledger"
kingdom: "web"
place: "wanderers-rest"
order: 1
xp: 150
difficulty: 1
minutes: 20
requires: []
skills: ["http"]
attributes: { recon: 1, logic: 1, patience: 1 }
summary: "Read a merchant's request and reply in full, and name every part of it the merchant does not control."
---

Every house in the Web Realm keeps its ledger the same way. You write a slip — a **request** — and hand it through the window. The house writes a slip back — a **response**. Nothing else ever passes between you. Learn to read both slips and you can read any house in the realm.

## The slip you hand in

A request is plain text. Here is one exactly as it crosses the wire:

```http
GET /ledger/entry?id=42&lang=en HTTP/1.1
Host: wanderers-rest.example
User-Agent: Mozilla/5.0
Cookie: session=9f2c1e7a
Accept: text/html
```

The first line is the **request line**. It holds a *method* — what you want done — then the *path* with its *query string* — which record you mean — and last the protocol version. `GET` asks the house to hand something over; `POST` hands something in to be written down.

```question
id: method
prompt: What method does the request above use?
answer: GET
hint: It is the first word of the request line.
```

Every line below the request line is a **header**: a name, a colon, a value. `Host` names the house you are addressing. `Cookie` carries back whatever the house asked you to keep last time — here, a session token that tells the house who you are.

```question
id: cookie-header
prompt: Which request header carries your session token back to the house?
answer: Cookie
hint: Look for the header whose value starts with session=.
```

## The slip that comes back

```http
HTTP/1.1 200 OK
Content-Type: text/html; charset=utf-8
Set-Cookie: session=9f2c1e7a; HttpOnly; Secure
Cache-Control: no-store

<h1>Entry 42 — three barrels of salt</h1>
```

The first line is the **status line**, and its three-digit **status code** is the house's verdict: `200` found and handed over, `302` look elsewhere, `403` you may not, `404` no such entry, `500` the house itself fell over.

```question
id: not-found
prompt: The ledger has no entry by the number you asked for. Which status code does it answer with?
answer: "404"
accept: ["404 not found"]
hint: No such entry.
```

`Set-Cookie` is the house asking you to keep something and hand it back on every later request. It is how a house that forgets everything between slips remembers who you are.

```question
id: set-cookie
prompt: Which response header asks you to keep a value and hand it back on later requests?
answer: Set-Cookie
accept: ["set cookie"]
hint: It is the partner of the request header from the second question.
```

## What the merchant does not control

Here is the whole lesson of Wanderer's Rest: **every character of the request is written by you.** The path, the `id`, the headers, the cookie — the house only ever sees the slip you choose to hand in. A browser fills it in politely, but a proxy lets you rewrite any of it before it leaves your hand. The house can check what arrives; it cannot stop you writing it.

So when you read a request, ask of every value: *what happens if I write something else here?*

```question
id: the-parameter
prompt: In the first request, which query parameter chooses the entry the ledger hands over?
answer: id
accept: ["id=42", "the id parameter"]
hint: It comes after the ? in the path.
```

> Asking the ledger for entry 43 when you were given 42 is where the Broken Gate begins. Only ever ask on ground a keeper has declared open.
