---
slug: "the-readers-tools"
title: "The Reader's Tools"
kingdom: "web"
place: "wanderers-rest"
order: 4
xp: 220
difficulty: 2
minutes: 30
requires: []
skills: ["recon", "http"]
attributes: { recon: 2, logic: 1 }
summary: "The browser you already have is a proxy and a disassembler. Most first findings are read straight out of its DevTools, not exploited."
---

You do not need a special weapon to start. The browser in front of you already records every request the page makes, holds everything it stored, and ships the whole source of the application. Open DevTools (F12) and the polite user interface stops hiding things. Most of a hunter's first findings are *read*, not exploited.

## The Network tab: what the page really asks for

Click through the app with the **Network** tab open, filter to `Fetch/XHR`, and watch the real calls. A profile page quietly fires:

```http
GET /api/v2/users/1024/profile HTTP/1.1
Host: api.target.com
Authorization: Bearer eyJhbGciOiJIUzI1Ni...
```

The screen showed you a name and a photo. DevTools showed you a number — `1024` — sitting in the path, chosen by the client. The obvious question is: what answers at `1025`?

```question
id: idor-seed
prompt: The request above fetches user 1024's profile, and 1024 comes straight from the URL. Changing it to 1025 to see if you get somebody else's profile tests which access-control vulnerability?
answer: IDOR
accept: [insecure direct object reference, idor / bola, bola]
hint: An id in the URL, and no check that it is *your* id.
```

## The Application tab: what the page kept

Open **Application → Storage**. `localStorage` is a favourite hiding place, and it hides badly:

```
token      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOi..."
api_key    "sk_live_51H8qL2eZvKf… "
```

Two findings in one panel. First, `sk_live_` is a **live** payment secret key — that alone is a critical report. Second, a session token kept in `localStorage` (rather than an HttpOnly cookie) is readable by any script on the page — so any XSS steals it outright.

```question
id: live-key
prompt: localStorage holds a value that begins sk_live_. What is that, and the reason it is a serious report on its own?
answer: a secret key
accept: [secret key, api key, live secret key, stripe secret key, a live api key, secret]
hint: The sk_live_ prefix marks a production Stripe secret, not a test one.
```

```question
id: storage-vs-cookie
prompt: A session token in localStorage versus the same token in an HttpOnly cookie — which of the two can a cross-site scripting bug read and steal?
answer: localStorage
accept: [local storage, the localstorage one, the token in localstorage, the one in localstorage]
hint: HttpOnly deliberately hides the cookie from JavaScript; localStorage hides nothing.
```

## The Sources tab: the whole app, handed over

The application ships you its own JavaScript. Open **Sources**, or just pull `main.js`, and read it — bundled code is minified, not secret. Real bundles leak the parts the UI never links:

```javascript
fetch(`/api/v1/admin/users?all=true`)       // an endpoint no button calls
const MAPS_KEY = "AIzaSyD-9tSrke7abc123...";  // a Google API key
const API = location.host.includes("staging")
  ? "https://api-staging.target.com" : "https://api.target.com";
```

Three finds from one file: an admin endpoint to try, a key to check, and the name of the staging backend.

```question
id: js-endpoint
prompt: Reading main.js you find a call to /api/v1/admin/users that no button on the site triggers. What has reading the JavaScript just given you?
answer: a hidden endpoint
accept: [hidden endpoint, an endpoint, undocumented endpoint, admin endpoint, a new endpoint]
hint: Something to send to Repeater — the UI never links it, but it is still live.
```

```question
id: js-key
prompt: The same file contains a string beginning AIzaSy. What kind of secret is that?
answer: a Google API key
accept: [google api key, api key, google key, google maps api key]
hint: The AIzaSy prefix is unmistakable.
```

## The Elements tab: what the HTML admits

The rendered HTML carries fields the user is not meant to change, and comments the developer forgot to strip:

```html
<input type="hidden" name="price" value="49.99">
<input type="hidden" name="user_role" value="customer">
<!-- TODO: disable /api/debug before launch -->
```

A hidden field is only hidden from the *eye* — it is sent in the request like any other, and you rewrite it before it leaves your hand. The comment leaks an endpoint the developer meant to remove.

```question
id: hidden-price
prompt: A checkout form carries a hidden field named price with value 49.99, submitted with the order. Which field's value would you tamper in the request to test the price?
answer: price
accept: [the price field, price field]
hint: It is right there in the form, marked hidden — but still sent.
```

```question
id: html-comment
prompt: An HTML comment left in the page reads "TODO — disable /api/debug before launch". What did that comment just leak to you?
answer: /api/debug
accept: [api/debug, a debug endpoint, an endpoint, the debug endpoint]
hint: Something to go and request yourself.
```

> Every one of those was sitting in the browser you already had open. Before you reach for a tool, read the ground the application hands you: the calls it makes, the secrets it stores, the code it ships, the fields it hides. Half the reports in the realm start here.
