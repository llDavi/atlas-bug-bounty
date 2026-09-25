---
slug: "encode-decode-compare"
title: "Encode, Decode, Compare"
kingdom: "web"
place: "web-village"
order: 3
xp: 220
difficulty: 2
minutes: 30
requires: []
skills: ["http"]
attributes: { exploitation: 1, logic: 2 }
summary: "Payloads that die in transit, tokens that hide in base64, and two near-identical responses: the small tools that decide whether an attack even arrives."
---

Half of a working attack is getting the payload there intact, and half of reading the result is spotting the tiny difference between two responses. Burp's smaller tools — the **Decoder** and the **Comparer** — plus a firm grip on **encoding** and a copy of `curl`, are what turn a good idea into a delivered one.

## Encoding: so the payload survives the trip

The same characters mean different things in a URL, in HTML, and in a shell, so a raw payload often dies before it lands. A hunter's reflex is to encode for the context. Take an XSS probe headed into a query string:

```
<script>alert(1)</script>
```

Dropped straight into `?q=`, the `<`, `>` and spaces can be mangled or stripped. URL-encoded, it travels as written:

```
?q=%3Cscript%3Ealert(1)%3C%2Fscript%3E
```

`%3C` is `<`, `%3E` is `>`, `%2F` is `/`. The server decodes it back and — if it is vulnerable — reflects the live tag. Get the encoding wrong and you will swear the target is safe when your payload simply never arrived intact.

```question
id: url-encode
prompt: You put a script payload straight into a query parameter and see nothing, but the same payload URL-encoded as %3Cscript%3E gets reflected as a live tag. What most likely stopped the first attempt — the app being secure, or the payload not surviving the URL intact?
answer: the payload not surviving
accept: [encoding, the encoding, it did not arrive intact, transport, not encoded]
hint: Remember that %3C is simply the URL-safe way of writing a less-than sign.
```

```question
id: percent3c
prompt: In a URL, which single character does the sequence %3C represent?
answer: <
accept: [less than, less-than, less than sign, left angle bracket]
hint: It is the character an HTML tag opens with.
```

## Decoder: reading what the app hid in plain sight

The Decoder (or CyberChef) unwinds the encodings apps lean on. A "random" token in a reset link:

```
eyJ1aWQiOjEwMjQsImV4cCI6MTcyMDAwMDAwMH0
```

looks opaque until you base64-decode it to `{"uid":1024,"exp":1720000000}`. It was never encrypted — only encoded. Now you can see it carries your user id and an expiry, and you can ask what happens if you swap `1024` for another id and re-encode.

```question
id: base64
prompt: A token in a reset link looks random, but decoding it as base64 yields readable JSON with a uid and an expiry. Was that token encrypted, or merely encoded so it looked opaque?
answer: encoded
accept: [only encoded, just encoded, not encrypted, base64 encoded]
hint: Base64 is reversible by anyone; encryption is not.
```

## Comparer: the difference you would otherwise miss

Two responses can look identical and differ in one line that decides everything. The **Comparer** diffs them for you. The classic case is a login or a password-reset that leaks which usernames exist:

```
username=alice  ->  401, length 1841, "Invalid credentials"
username=zzzzz  ->  401, length 1826, "No such user"
```

Same status, near-identical page — but 15 bytes and one phrase apart. That difference is a **username enumeration** finding: the app tells you which accounts are real. Word by word, the Comparer makes the gap obvious.

```question
id: comparer
prompt: Two login responses both return 401, but one is length 1841 saying "Invalid credentials" and the other is 1826 saying "No such user". What does that reliable difference let an attacker do?
answer: enumerate usernames
accept: [username enumeration, user enumeration, enumerate users, tell which accounts exist, find valid usernames]
hint: The app quietly confirms which accounts are real.
```

## curl: the request, reproducible

When you report a bug, "click around until it happens" is not proof. `curl` turns an exact request into one line anyone can paste and re-run:

```
curl -i 'https://shop.target.com/api/v1/orders/8242' \
  -H 'Authorization: Bearer eyJ...'
```

`-i` shows the response headers, `-H` sets a header. A triager runs that line, sees the other customer's order come back, and your IDOR is undeniable. Burp will even generate the `curl` for a request for you (`Copy as curl`).

```question
id: curl-repro
prompt: In a report, rather than describing clicks, you want to hand the triager one exact command they can paste to reproduce the request with your headers. Which command-line tool is the standard for that?
answer: curl
accept: [curl command, use curl]
hint: Burp's "Copy as ___" produces exactly this.
```

> The idea does not matter if the payload dies in the URL, the token stays opaque, or the one telling difference between two responses goes unread. Encode for the context, decode what looks random, diff what looks the same, and hand over a request anyone can re-run.
