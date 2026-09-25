---
slug: "api-flows-and-webhooks"
title: "Flows and Webhooks"
kingdom: "api"
place: "toll-roads"
order: 2
xp: 260
difficulty: 3
minutes: 30
requires: []
skills: ["ssrf", "logic"]
attributes: { exploitation: 2, logic: 2 }
summary: "The routes an API exposes for its own convenience — a business flow with no human speed limit, a file upload, a webhook that fetches a URL you choose — each hand you a lever the UI never would."
---

Beyond single endpoints, an API exposes *flows* and *integrations* that were designed for machines and forget that an attacker is a machine too. A checkout flow with no rate of a human, an upload that skips the browser's guards, a webhook that fetches whatever URL you register — each is a toll road you can drive faster and further than intended.

## The business flow with no human pace

APIs expose the whole workflow as endpoints, so an attacker automates flows a UI would have throttled: buying every limited-edition item in the first millisecond, claiming every referral bonus, scalping all the concert tickets. OWASP calls this *unrestricted access to sensitive business flows* — the endpoints work, but nothing stops one actor from running the flow ten thousand times.

```question
id: business-flow
prompt: A "claim referral bonus" flow is a plain API call, so a script claims it thousands of times in seconds — something a human clicking could never do. What class of API flaw is exposing a sensitive business flow with no anti-automation?
answer: unrestricted access to sensitive business flows
accept: [unrestricted access to sensitive business flows, business flow abuse, sensitive business flow abuse, workflow abuse, business logic abuse, unrestricted business flow]
hint: The flow is fine for one human but ruinous run ten thousand times by a bot.
```

## The upload with the browser removed

A file-upload API takes the bytes directly, without any of the browser-side checks the web form pretended to enforce. Every upload flaw from the Web Realm applies, plus API-specific ones: the server may store the file under a path you control in the filename, or return a URL that reveals the storage bucket. Test the real content type, the extension, and where the file lands.

```question
id: upload
prompt: A file-upload API accepts your bytes directly, and you upload a file whose declared type is an image but whose contents are a web shell. Because the API took the bytes with none of the browser's checks, what must you always test about where it puts the file?
answer: whether it can be executed
accept: [whether it is executable, where it lands, if it is executable, whether it runs, if the path is executable, where it is stored and if it runs]
hint: A shell is only useful if the server will execute the file it stored.
```

## The webhook that fetches your URL

A webhook or integration lets you register a URL the server will call — on an event, or to validate. That is **SSRF** handed to you by design: point it inward.

```
POST /api/v1/webhooks   {"url": "http://169.254.169.254/latest/meta-data/"}
```

When the server calls your "webhook", it fetches the cloud metadata and may hand you the credentials, or reach an internal service. Any feature that says "we will call this URL" is an SSRF test.

```question
id: webhook-ssrf
prompt: A webhook feature lets you register a URL the server will fetch, and you set it to the cloud metadata address. What vulnerability does a server-fetches-your-URL feature almost always need testing for?
answer: SSRF
accept: [ssrf, server-side request forgery, server side request forgery]
hint: You make the server request a URL of your choosing.
```

## The webhook that talks back

Webhooks also flow the other way: the API *sends* you signed events. If the signature is not verified, an attacker forges an event — a fake "payment succeeded" — and the app grants goods for money never paid. Check whether inbound webhook events are authenticated at all.

```question
id: webhook-forge
prompt: A payment provider's webhook tells your app "payment succeeded", but the app does not verify the webhook's signature. What can an attacker send to receive goods without paying?
answer: a forged event
accept: [a forged webhook, a forged event, a fake payment event, a forged payment success, a spoofed webhook, fake event]
hint: With no signature check, anyone can post the "success" event.
```

> The convenient routes are the dangerous ones. Run the business flow at machine speed, upload past the guards the browser only pretended to enforce, aim any "we will fetch your URL" feature inward, and forge the "success" event a webhook forgot to verify. APIs expose the whole machine, and the machine has no common sense.
