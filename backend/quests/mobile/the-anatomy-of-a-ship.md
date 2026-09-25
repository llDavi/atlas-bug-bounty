---
slug: "mobile-the-anatomy-of-a-ship"
title: "The Anatomy of a Ship"
kingdom: "mobile"
place: "anatomy-of-a-ship"
order: 1
xp: 220
difficulty: 2
minutes: 30
requires: []
skills: ["recon"]
attributes: { recon: 2, logic: 1 }
summary: "A mobile app is a client you hold in your hand — and its brain lives elsewhere, in an API. Where the app is honest is the wire; where it is careless is the device you fully control."
---

A mobile app looks like a program, but it is a *client* — a pretty front-end whose real logic and authority live in a backend it calls, almost always an HTTP API of the kind you just spent a kingdom learning. So the first truth of mobile hunting: most "app bugs" are really API bugs, found by watching the app talk. The second truth: the device is *yours*, so anything the app hides on it, you can dig out.

## The brain is in the backend

Tap "transfer money" and the app sends a request to `api.bank.com/transfer`. The app decided nothing important; the API did. That is why intercepting the app's traffic (next chapters) drops you straight into the API kingdom — BOLA, mass assignment, broken auth, all reachable from the app's own requests.

```question
id: brain
prompt: You tap a button in a banking app and it sends a request to its server. Where does the real authorization and business logic of a mobile app almost always live — in the app on the phone, or in the API backend it calls?
answer: the API backend
accept: [the api, the backend, the api backend, the server, the backend api, in the api]
hint: The app is a client; the brain is server-side.
```

## The ship is a zip

An Android app ships as an **APK** and an iOS app as an **IPA**, and both are just zip archives. Rename `app.apk` to `app.zip`, unzip it, and you have the compiled code (`classes.dex` on Android, a Mach-O binary on iOS), the resources, and — the prize — the manifest that declares everything the app does.

```question
id: apk-zip
prompt: To start reading an Android app you have its .apk file. At its core, what kind of file is an APK, which you can simply unzip to get at the code and manifest inside?
answer: a zip archive
accept: [a zip, a zip archive, a zip file, an archive, zip]
hint: Rename it .zip and open it.
```

## The device is hostile ground

Here is the assumption that makes mobile different from web: the attacker owns the phone. It can be rooted or jailbroken, so every file the app writes, every key it bundles, every check it runs *on the device* is visible and defeatable. A secret stored in the app is not a secret — it is a delay.

```question
id: hostile-device
prompt: Because a user can root or jailbreak their own phone and read everything on it, what is true of any API key, password or token the app stores or hardcodes on the device?
answer: it can be extracted
accept: [it can be extracted, it is readable, it is not secret, it can be read, it is recoverable, it is exposed, anyone can extract it]
hint: On a device you control, nothing stored is truly hidden.
```

## Where it keeps things

The app must remember some things between launches, and *where* it keeps them is where storage bugs live: on Android, `SharedPreferences` XML files and SQLite databases under the app's data directory; on iOS, `Info.plist`, `NSUserDefaults`, and the (better-protected) **Keychain**. Sensitive data in the wrong store — a token in plain SharedPreferences instead of the Keychain/Keystore — is a finding you will hunt in Chapter Six.

```question
id: storage
prompt: An Android app saves the user's auth token in a plain SharedPreferences XML file rather than the protected Android Keystore. On a rooted device, what is the problem with that choice?
answer: the token is readable
accept: [the token is readable, it can be read, insecure storage, the token is exposed, anyone can read it, it is stored in plaintext, insecurely stored]
hint: Plain preferences are just a readable file on a device the attacker controls.
```

> A mobile app is a client with its brain in an API and its careless secrets on a device you own. Watch the wire and you are back in the API kingdom; open the ship and read the device, and you find what the app was never able to truly hide. Both halves are the hunt.
