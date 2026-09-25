---
slug: "confusing-the-middlemen"
title: "Confusing the Middlemen"
kingdom: "web"
place: "injection-marshes"
order: 2
xp: 300
difficulty: 4
minutes: 40
requires: []
skills: ["http"]
attributes: { exploitation: 2, logic: 3 }
summary: "Between you and the server sit proxies and caches. Make two of them disagree — about where a request ends, or about what is safe to store — and one person's poison is served to everyone."
---

Your request rarely reaches the server directly; it passes through load balancers, reverse proxies and caches. Each is a middleman with its own idea of what the request means. When two middlemen *disagree*, a hunter can smuggle a hidden request past one, or poison a cache that then serves the attack to every later visitor. These are among the highest-impact bugs on the modern web, because one request harms thousands.

## Smuggling a request inside a request

A front-end proxy and the back-end server must agree on where one request ends and the next begins. They usually use `Content-Length` or `Transfer-Encoding` to decide. Craft a request where the two headers point at *different* boundaries, and the front-end forwards what it thinks is one request while the back-end sees one-and-a-bit — the leftover bytes prepend onto the *next* visitor's request:

```
front-end trusts Content-Length  ->  sees one request
back-end trusts Transfer-Encoding ->  sees a second, smuggled request
```

That smuggled fragment can steal the next user's request (capturing their session cookie) or route them to an attacker-controlled response. This is **HTTP request smuggling**, and it comes precisely from the two hops disagreeing on request length.

```question
id: smuggling
prompt: A front-end proxy uses Content-Length to find the end of a request while the back-end uses Transfer-Encoding, and they disagree, so leftover bytes attach to the next visitor's request. What is this attack called?
answer: request smuggling
accept: [request smuggling, http request smuggling, smuggling, desync]
hint: You smuggle a hidden request past the front-end into the back-end's view.
```

## Poisoning what everyone is served

A cache stores a response under a **key** (usually the path) and serves that stored copy to everyone who asks for the same key. If the response is built using an input that is *not part of the key* — an unkeyed header like `X-Forwarded-Host` — you can poison the stored copy:

```
GET / HTTP/1.1
X-Forwarded-Host: evil.attacker.com
->  the page now builds links to evil.attacker.com, and the cache stores it
```

Every later visitor to `/` is served your poisoned page — a reflected bug turned into a mass, persistent one. That is **web cache poisoning**.

```question
id: cache-poison
prompt: A page reflects the X-Forwarded-Host header into its links, and the cache stores the response keyed only by path, so every later visitor gets your injected host. What is this attack called?
answer: web cache poisoning
accept: [cache poisoning, web cache poisoning]
hint: You poison the shared cached copy that everyone downstream receives.
```

## Tricking the cache into storing secrets

The mirror image is **web cache deception**: you make a victim request their private page under a path the cache thinks is a static file, so the cache stores their *personal* response and serves it to you:

```
https://target.com/account/profile/nonexistent.css
```

The app ignores the `.css` and returns the victim's account page; the cache sees `.css`, assumes it is a harmless static asset, and caches it. Now the attacker requests the same URL and receives the victim's cached private data.

```question
id: cache-deception
prompt: You trick a victim into loading /account/profile/anything.css; the app serves their private account page but the cache stores it because of the .css extension, letting you retrieve it. What is this attack called?
answer: web cache deception
accept: [cache deception, web cache deception]
hint: You deceive the cache into storing a private response as if it were static.
```

> The middlemen are a soft target because they trust each other. Make two hops disagree on where a request ends, or make a cache store something built from an input it did not key on — and a bug that would hit one person is served, at scale, to everyone behind the same proxy.
