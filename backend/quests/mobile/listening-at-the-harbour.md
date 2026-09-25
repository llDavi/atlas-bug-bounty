---
slug: "mobile-listening-at-the-harbour"
title: "Listening at the Harbour"
kingdom: "mobile"
place: "listening-harbour"
order: 1
xp: 260
difficulty: 3
minutes: 35
requires: []
skills: ["recon"]
attributes: { recon: 2, exploitation: 2 }
summary: "Put your proxy between the app and its API and you are back on familiar water — unless the app pins its certificate, which you then defeat, because the device is yours."
---

The single most productive thing you can do to a mobile app is watch it talk. Route its traffic through Burp and every request to its API is yours to read and rewrite — dropping you straight into the API kingdom. The one obstacle is **certificate pinning**, and on a device you control, it is an obstacle you remove.

## Getting the traffic into Burp

You set the phone's proxy to your Burp instance and install Burp's CA certificate so HTTPS still decodes. Now the app's calls appear in the HTTP history exactly like a browser's, and everything you learned about APIs applies to them: change the id, drop the token, add the field.

```question
id: proxy
prompt: You route a mobile app's traffic through Burp and install Burp's certificate on the phone. Once its API requests appear in your proxy, which kingdom's techniques — changing object ids, tampering fields, removing tokens — do you now apply to them?
answer: the API
accept: [api, the api, the api kingdom, api techniques, the trade routes]
hint: The app's traffic is API traffic.
```

## The wall: certificate pinning

Secure apps ship the expected server certificate inside the app and refuse to talk to anything else — so Burp's certificate is rejected and the traffic goes dark. This is **certificate pinning**, and its whole purpose is to stop exactly what you are doing.

```question
id: pinning
prompt: After setting up your proxy, the app refuses to connect and shows a TLS error, because it will only trust the certificate baked into it — not Burp's. What is this defence called?
answer: certificate pinning
accept: [certificate pinning, cert pinning, ssl pinning, pinning]
hint: The app pins the certificate it will accept.
```

## Why the wall does not hold

Pinning protects against a network attacker — but you are not on the network, you are on the *device*, which you own. So you defeat the check where it runs: `objection` and `Frida` hook the pinning function at runtime and force it to accept your certificate, with a one-line command:

```
objection -g com.app.name explore
android sslpinning disable
```

Because the check executes on hardware you control, it can always be neutered. Pinning is a speed bump for a hunter, not a wall.

```question
id: pinning-bypass
prompt: The app pins its certificate, but you use Frida or Objection to hook the pinning check at runtime and force it to accept your proxy's certificate. Why can this bypass always work — what do you control that makes the on-device check defeatable?
answer: the device
accept: [the device, you control the device, the device is yours, the runtime, the app runtime, control of the device]
hint: The check runs on your own phone.
```

## Once you are in, it is an API assessment

With pinning off and traffic flowing, the mobile assessment becomes an API assessment plus whatever the app leaks on the device. The endpoints you found statically, now live in the proxy, get the full Trade Routes treatment — and mobile apps' APIs are frequently *less* hardened than their web equivalents, because the team assumed no one would ever see the traffic.

```question
id: less-hardened
prompt: Mobile app APIs are often less hardened than the same company's web APIs. What false assumption by the developers explains that?
answer: nobody would see the traffic
accept: [that no one could see the traffic, they assumed the traffic was hidden, pinning would hide it, no one intercepts mobile traffic, the traffic could not be read, they thought it was invisible]
hint: They trusted pinning and the binary to keep the requests secret.
```

> Listening is the whole harbour. Proxy the app, and if it pins, strip the pin on the device that is yours to command — then treat the app's backend exactly like the Trade Routes, often finding it softer than the website because nobody expected you to be listening at all.
