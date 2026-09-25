---
slug: "mirrors-in-the-machine"
title: "Mirrors in the Machine"
kingdom: "web"
place: "hall-of-mirrors"
order: 2
xp: 280
difficulty: 3
minutes: 40
requires: []
skills: ["xss"]
attributes: { exploitation: 2, logic: 2 }
summary: "Some reflections never touch the server. DOM XSS lives entirely in the page's own JavaScript — a source you control flowing into a sink that executes."
---

Not every XSS goes through the server. **DOM-based XSS** happens entirely in the browser: the page's own JavaScript reads a value *you* can set — the URL, the fragment — and writes it somewhere dangerous, without the server ever seeing the payload. To find it you stop reading responses and start reading the app's JavaScript for two things: **sources** (input you control) flowing into **sinks** (functions that turn a string into markup or code).

## Source into sink

A **source** is where attacker-controllable data enters the JavaScript: `location.hash`, `location.search`, `document.referrer`, a `postMessage`. A **sink** is a function that executes or renders a string: `element.innerHTML`, `document.write`, `eval`, `setTimeout` with a string, `location = …`. DOM XSS is a source reaching a sink with no sanitisation. Real code from a bundle:

```javascript
let name = decodeURIComponent(location.hash.slice(1));  // source: the # fragment
document.getElementById("welcome").innerHTML = name;    // sink: innerHTML
```

Load `https://app.target.com/#<img src=x onerror=alert(1)>` and the script writes your tag straight into the page. The server logs only `GET /` — the payload lived after the `#`, which browsers never send to the server.

```question
id: source-sink
prompt: Page JavaScript reads location.hash and passes it into element.innerHTML with no sanitisation, so a payload in the URL fragment executes. In DOM XSS terms, location.hash is the source — what is innerHTML called?
answer: the sink
accept: [sink, a sink, the sink, the dangerous sink]
hint: It is the function that turns your string into live markup.
```

## Why the server never sees it

Everything after the `#` in a URL is the **fragment**, and the browser keeps it local — it is never sent in the HTTP request. That is why DOM XSS is invisible in server logs and in a proxy's request view, and why a WAF cannot catch it. You find it by reading client code, not responses.

```question
id: fragment
prompt: A DOM XSS payload sits in the part of the URL after the # symbol. Why do the server logs and a WAF never see that payload?
answer: the fragment is not sent to the server
accept: [the fragment stays in the browser, it is never sent, the browser does not send the fragment, it stays client-side, the hash is not sent, fragment not sent]
hint: The browser does not include the fragment in the HTTP request.
```

## Reading the sinks

Hunting DOM XSS is grep-work through the JavaScript for the dangerous sinks and tracing each back to a source you control. `innerHTML`, `outerHTML`, `document.write`, `eval`, `Function()`, `setTimeout`/`setInterval` with strings, jQuery's `$()` and `.html()`. If a source reaches one unfiltered, you have it — DevTools' debugger lets you set a breakpoint on the sink and watch your input arrive.

```question
id: sinks
prompt: You are auditing a page's JavaScript for DOM XSS. Name one JavaScript sink that will execute or render a string you get into it.
answer: innerHTML
accept: [innerhtml, document.write, eval, outerhtml, settimeout, function, .html, location, insertadjacenthtml, document write]
hint: The most common one turns a string into HTML on an element.
```

## Poisoning the object every script trusts

**Prototype pollution** is DOM XSS's stranger cousin: many apps merge user-controlled JSON into objects, and a crafted key like `__proto__` writes onto the base `Object` prototype that *every* object inherits. Set a property there that a library later reads as config — a template, a redirect, a script src — and you turn pollution into XSS or worse:

```
?__proto__[innerHTML]=<img src=x onerror=alert(1)>
```

The bug is not one sink; it is corrupting the shared object every other script quietly trusts.

```question
id: proto
prompt: An app merges your query parameters into an object, and a key named __proto__ lets you set a property on the prototype that every object inherits. What is this vulnerability class called?
answer: prototype pollution
accept: [prototype pollution, proto pollution]
hint: You pollute the shared prototype the whole app inherits from.
```

> DOM XSS is a bug you read, not one you send: a source you control flowing into a sink that executes, entirely in the browser. Grep the JavaScript for the sinks, trace them back to the URL and the fragment, and watch for the merge that lets you poison the prototype every other script leans on.
