---
slug: "repeater-and-intruder"
title: "Repeater and Intruder"
kingdom: "web"
place: "web-village"
order: 2
xp: 240
difficulty: 2
minutes: 35
requires: []
skills: ["http", "recon"]
attributes: { exploitation: 2, patience: 1 }
summary: "Repeater interrogates one request by hand; Intruder throws a wordlist at it. Together they turn a hunch into a hundred tries a minute."
---

Once you have an interesting request, you stop clicking the page and start driving it. Two tools do almost all the work: **Repeater**, for asking one request the same question with your own changes; and **Intruder**, for asking it a thousand times with a wordlist.

## Repeater: one request, asked carefully

You send the intercepted request to Repeater and now you own it. Change one thing, hit **Send**, read the response, change one more thing. A real example — an order lookup:

```http
GET /api/v1/orders/8241 HTTP/1.1
Host: shop.target.com
Authorization: Bearer eyJ...
```

In Repeater you send `8241`, then `8242`, then `8240`, watching the status and length. `8241` returns your order; `8242` returns **someone else's order** with a 200 — you have just confirmed an IDOR by hand, one send at a time. Repeater's value is control: you see exactly what one change does.

```question
id: repeater-one
prompt: In Repeater you send /orders/8241 and get your own order, then change it to 8242 and get a 200 with a different customer's order. Changing one value by hand and reading each response is the strength of which Burp tool?
answer: Repeater
accept: [burp repeater, the repeater]
hint: You repeated the request, one careful change at a time.
```

## Intruder: the same request, a thousand times

When one change becomes a thousand — try every id, every username, every value in a wordlist — you mark the spot with a payload position and hand it to **Intruder**. You set the target parameter and load a list, and Intruder fires them all, tabulating status and length so the odd one out jumps out:

```
Payload   Status  Length
admin      200     4021     <-- everyone else is 302 / 1180
alice      302     1180
bob        302     1180
guest      302     1180
```

`admin` answered differently — a longer 200 where every other guess bounced with a 302. You do not read a thousand responses; you sort by length and read the one that broke the pattern.

```question
id: intruder-outlier
prompt: Intruder fires a wordlist at a parameter and tabulates the responses. Ninety-nine come back 302 with length 1180 and one comes back 200 with length 4021. Which result do you investigate?
answer: admin
accept: [the 200, the outlier, the different one, the 4021, the one that differs]
hint: The interesting answer is the one that does not match all the others.
```

```question
id: intruder-what
prompt: You want to try every value from a wordlist in a single request position and compare all the responses at once, rather than sending each by hand. Which Burp tool is built for that?
answer: Intruder
accept: [burp intruder, the intruder]
hint: It intrudes with a whole list at once.
```

## Wordlists: you are only as good as your list

Intruder and every fuzzer is fed a **wordlist**, and the list decides what you find. Generic lists (SecLists' `common.txt`) find generic things; the wins come from lists shaped to the target — words pulled from its own JavaScript, its API version numbers, its employee names. A content-discovery run with `ffuf` is the same idea outside Burp:

```
ffuf -u https://shop.target.com/FUZZ -w raft-medium-directories.txt -mc 200,301,302,403
```

The `FUZZ` marker is the payload position; the `-mc` keeps only interesting status codes. A hidden `/admin`, `/backup`, or `/.git` falls out of a list, not out of luck.

```question
id: wordlist
prompt: Two hunters fuzz the same endpoint; one finds a hidden /backup path and the other finds nothing. Neither wrote an exploit. What most likely made the difference?
answer: the wordlist
accept: [wordlist, the list, a better wordlist, their wordlist]
hint: The fuzzer only ever tries what you feed it.
```

## Knowing when to automate

Repeater is for understanding; Intruder and `ffuf` are for covering ground once you understand. The mistake is reaching for automation first — throwing a thousand payloads at something you have not read. Read one request in Repeater until you know what a *win* would look like, then let the wordlist find it at scale.

```question
id: order-of-work
prompt: You have a brand-new endpoint you do not yet understand. Do you first blast it with a thousand-line wordlist in Intruder, or study one request in Repeater until you know what a successful result would even look like?
answer: Repeater
accept: [repeater first, study it in repeater, understand first, one request first]
hint: Automation finds nothing if you cannot recognise the win.
```

> Repeater is a scalpel and Intruder is a net. Learn the request by hand until you know the shape of the answer you want, then cast the net — a good wordlist through Intruder or ffuf — and let the outlier surface.
