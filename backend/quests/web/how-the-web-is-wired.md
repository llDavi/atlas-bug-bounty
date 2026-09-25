---
slug: "how-the-web-is-wired"
title: "How the Web Is Wired"
kingdom: "web"
place: "wanderers-rest"
order: 2
xp: 200
difficulty: 1
minutes: 25
requires: []
skills: ["recon", "http"]
attributes: { recon: 2, logic: 1 }
summary: "Follow one request from a name to a house to a door — and read the recon each hop hands you."
---

Before you read a single reply, your request has already crossed half the realm: a **name** became an **address**, the address answered on a **door**, and a **road** carried every byte between. A hunter reads each of those hops, because each one leaks something the target never meant to hand over.

## The name, and what it hides

A target is a name. Ask the realm's directory — **DNS** — what stands behind it, and it answers in records. Here is a real answer, read straight off the wire:

```
target.com.        299  IN  A      13.225.14.87
www.target.com.    299  IN  CNAME  target.com.
shop.target.com.   299  IN  CNAME  shops.myshopify.com.
mail.target.com.   299  IN  MX     10 aspmx.l.google.com.
```

An **A** record nails a name to an IPv4 address — the actual house. A **CNAME** says *"I am only another name for that one; go ask there."* An **MX** names who takes the mail.

```question
id: a-record
prompt: In the DNS answer above, which record type maps target.com to its IPv4 address 13.225.14.87?
answer: A
accept: [a record, address record]
hint: A single letter — the most direct kind of record there is.
```

The line a hunter's eye stops on is `shop.target.com`. It is a CNAME onto `shops.myshopify.com` — a house the target does not own, standing on somebody else's land. If that Shopify shop was ever closed and never reclaimed, anyone may register it and answer for `shop.target.com`. A dangling CNAME onto an unclaimed service is the whole shape of a **subdomain takeover**.

```question
id: takeover
prompt: shop.target.com is a CNAME onto shops.myshopify.com, which now returns "Sorry, this shop is currently unavailable." A dangling CNAME like this points to which class of vulnerability?
answer: subdomain takeover
accept: [takeover, subdomain-takeover, sub-domain takeover]
hint: If the target no longer holds the name it points at, someone else can claim it and answer in their place.
```

That is why the humble CNAME is worth its own line in your notes: it is the record that quietly names the third-party service — Shopify, GitHub Pages, AWS, Fastly — sitting behind a subdomain.

```question
id: cname
prompt: Which record type tells you a subdomain is only an alias for another host, often revealing the cloud service that actually answers for it?
answer: CNAME
accept: [cname record]
hint: shop.target.com used one to point at Shopify.
```

```question
id: mx
prompt: You want to know who handles the target's email. Which record type lists the mail servers?
answer: MX
accept: [mx record]
hint: It is in the answer above, pointing at a Google host.
```

## The house, and its doors

Behind the name is an IP, and an IP answers on **ports** — numbered doors. Your `https://` knock reaches port **443**; plain `http://` reaches **80**. But a house keeps more doors than the two it advertises. Point a scanner at it and it stops pretending:

```
PORT     STATE  SERVICE      VERSION
22/tcp   open   ssh          OpenSSH 8.9
80/tcp   open   http         nginx
443/tcp  open   https        nginx
8080/tcp open   http-proxy   Jenkins 2.361
```

```question
id: https-port
prompt: Unless told otherwise, which TCP port does a request to https://target.com reach?
answer: "443"
hint: The secure sibling of port 80.
```

The first three doors are ordinary. The fourth is the find: `8080` is not where visitors are sent, and a Jenkins on it has, more than once, been an unauthenticated console one script-console away from running commands on the box. The whole port list is intel; the port nobody advertises is where you knock first.

```question
id: extra-door
prompt: In the scan above, which open port exposes a Jenkins console that no ordinary visitor is ever sent to, and so is where a hunter knocks first?
answer: "8080"
accept: [8080/tcp]
hint: Not 80, not 443 — the door the house did not advertise.
```

## The road under all of it

Under name and door runs the transport. **TCP** shakes hands before it speaks and delivers every byte in order; **UDP** is fire-and-forget, which is why DNS itself rides it — one small question, one small answer, no ceremony. A page load cannot lose a byte or take them out of order, so it rides TCP, every time.

```question
id: transport
prompt: A page load must arrive complete and in order. Which transport protocol carries it, rather than the fire-and-forget one that DNS uses?
answer: TCP
hint: Three letters; it shakes hands before it speaks.
```

> None of this was an attack. It was reading the map the target drew for you without meaning to — the names it publishes, the doors it leaves open, the services it rents and forgets. Every hunt in the realm begins on this road, so learn to read it in your sleep.
