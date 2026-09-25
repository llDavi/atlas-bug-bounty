---
slug: "the-proxy-in-the-middle"
title: "The Proxy in the Middle"
kingdom: "web"
place: "web-village"
order: 1
xp: 220
difficulty: 2
minutes: 30
requires: []
skills: ["http"]
attributes: { exploitation: 1, patience: 1, logic: 1 }
summary: "Sit your proxy between the browser and the house, and every request stops being polite — you can read it, hold it, and rewrite it before it leaves."
---

The browser fills the request in politely and sends it before you can touch it. A **proxy** breaks that habit: it sits between the browser and the house, catches every request in mid-air, and lets you read it, hold it, and rewrite any byte before you let it go. Burp Suite (or Caido, or mitmproxy) is that proxy, and learning to drive it is the whole of this chapter.

## Catching a request in the air

You point the browser at Burp's proxy (127.0.0.1:8080), install its certificate so HTTPS still works, and turn **Intercept** on. Now a login submit does not leave — it stops on your desk:

```http
POST /login HTTP/1.1
Host: shop.target.com
Content-Type: application/x-www-form-urlencoded
Content-Length: 44

username=alice&password=hunter2&remember=1
```

Nothing here is fixed. The browser typed it, but the house has not seen it yet. You can change `username`, add a header, delete `remember`, and only then press **Forward**.

```question
id: intercept
prompt: With intercept on, a request pauses at your proxy before it reaches the server. At that moment, who has actually received the request the browser built?
answer: nobody
accept: [no one, no-one, the server has not, not the server]
hint: The whole point is that it is still on your desk, not the server's.
```

## The house only sees the slip

Here is the lesson the whole trade rests on, made concrete: the browser's form said `<input maxlength="8">` on the password, and greyed out a field, and validated your email in JavaScript. **None of that survives the proxy.** The server receives only the raw request above, and you write that request by hand. Client-side rules are suggestions to the browser, not to the server.

```question
id: client-rules
prompt: A form enforces a maxlength of 8 on a field and validates the email in JavaScript before submitting. After you intercept the request in the proxy, do those client-side rules still limit what you can send to the server?
answer: no
accept: [they do not, no they do not, client-side only]
hint: They ran in the browser; the proxy sits after the browser.
```

## Rewriting before you forward

A real first test: the request carried `remember=1`. What does the app do with `remember=0`, or `remember=admin`, or with the whole parameter removed? You edit the intercepted request and forward each variant, watching the response. Same with headers — add `X-Forwarded-For: 127.0.0.1`, change the `Host`, drop the `Origin` — and see what the house does differently.

```question
id: rewrite
prompt: The intercepted request contains remember=1. To find out how the server behaves when that value is something it never expected, which part of the exchange do you edit before pressing Forward — the request, or the response?
answer: the request
accept: [request, the request before forward]
hint: You are shaping what the house receives, not what it already sent back.
```

## Reading the whole conversation

Even with intercept off, the proxy keeps the full **HTTP history**: every request the app made and every response, in order. That is where you notice the call the UI never mentioned — a background `GET /api/v1/config` that returns feature flags, or a request to a second host you had not scoped yet. The proxy is not only a weapon; it is the most honest map of what the application actually does.

```question
id: history
prompt: With intercept turned off, does the proxy still record every request and response the application makes, so you can review the full conversation afterwards?
answer: yes
accept: [it does, yes it does, the http history keeps them]
hint: It is called the HTTP history for a reason.
```

## Where you send it next

When a request looks interesting, you do not keep re-submitting it through the browser. You send it to a tool that lets you fire it again and again with your own changes — the **Repeater** — which is the next lesson. The proxy catches; Repeater interrogates.

```question
id: to-repeater
prompt: You have caught one interesting request and want to re-send it many times with small changes of your own, without touching the browser. To which Burp tool do you send it?
answer: Repeater
accept: [burp repeater, the repeater]
hint: You will repeat the request, tweaking one thing each time.
```

> The proxy is the single habit that separates reading a site from testing it. Everything the browser hides — the raw request, the calls behind the page, the rules that only ever bound the browser — the proxy lays flat on the desk for you to rewrite.
