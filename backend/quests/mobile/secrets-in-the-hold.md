---
slug: "mobile-secrets-in-the-hold"
title: "Secrets in the Hold"
kingdom: "mobile"
place: "secrets-in-hold"
order: 1
xp: 250
difficulty: 3
minutes: 30
requires: []
skills: ["auth", "logic"]
attributes: { exploitation: 2, logic: 2 }
summary: "One principle ties the mobile vulnerabilities together: any security the app enforces on the device is theatre, because the device is the attacker's. Storage, checks, detections — all fall."
---

The mobile vulnerability chapter has a single spine: **client-side security is theatre on a device the attacker owns**. Whatever the app stores, checks, or detects on the phone can be read, changed, or defeated. Every finding here is a version of the developer trusting the one thing they must not — the device.

## Data the app thought was hidden

**Insecure storage** is the most common mobile bug: tokens, PII, even passwords sitting in SharedPreferences, NSUserDefaults, or an unencrypted SQLite database. On a rooted or jailbroken phone (or in a plaintext backup) they are simply read out. The fix is the Keychain/Keystore; the bug is everything sensitive kept anywhere else.

```question
id: insecure-storage
prompt: An app keeps the session token and the user's full profile in an unencrypted SQLite database in its sandbox. On a rooted device or from a backup, what is the problem?
answer: it can be read
accept: [it can be read, it is readable, anyone can read it, insecure storage, it is exposed, plaintext and readable, it can be extracted]
hint: Unencrypted local data on a device you control is not private.
```

## Checks the app runs on itself

Apps enforce entitlements locally — a `is_premium` flag in preferences, a "you are an admin" boolean returned once and cached. Because it lives on the device, you change it. A **client-side authorization check** is not a control; the server must decide, or it is not decided at all.

```question
id: client-check
prompt: An app unlocks premium features when a local is_premium flag is true, and you edit that flag on your rooted device to true. Why did this work — where was the "premium" decision wrongly made?
answer: on the client
accept: [on the client, client-side, on the device, in the app, locally, the client decided it, on the device instead of the server]
hint: A decision made on the device is a decision the device's owner controls.
```

## Detections that detect nothing

Apps add **root/jailbreak detection** and anti-tampering to refuse to run on a compromised device. But that check also runs on the device, so `Frida` or `Objection` hooks it and forces it to return "clean". Such detections raise the effort slightly; they are not a security boundary, and reporting a *bypass* of one is usually low value — the real bugs are what the detection was trying to hide.

```question
id: root-detection
prompt: An app refuses to run on a rooted phone, but you hook the root-detection function with Frida so it always reports the device is clean. Why is on-device root detection not a real security control?
answer: it runs on the device
accept: [it runs on the device, the attacker controls it, it can be bypassed on the device, client-side and bypassable, it executes where the attacker has control, the check is on the phone]
hint: Like every on-device check, the device's owner can defeat it.
```

## Talking in the clear

**Insecure communication** still appears: an app that falls back to plain HTTP, or one whose TLS is misconfigured to accept any certificate (making even pinning irrelevant). Cleartext traffic on a hostile network hands over everything the app sends.

```question
id: cleartext
prompt: A mobile app sends some requests over plain HTTP instead of HTTPS. On an untrusted network, what does that cleartext communication expose?
answer: all the traffic
accept: [the traffic, all the data sent, everything it sends, the requests and responses, the data in transit, credentials and data, the traffic to a network attacker]
hint: Anyone on the network reads unencrypted requests.
```

> Every mobile vulnerability here is the same trust misplaced: data hidden on the device, a check run on the device, a detection performed by the device. The device is the attacker's, so all of it falls — and the token in the wrong store or the premium flag in preferences is the report, not the bypass of the detection guarding it.
