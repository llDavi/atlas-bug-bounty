---
slug: "mobile-the-unknown-vessel"
title: "The Unknown Vessel"
kingdom: "mobile"
place: "unknown-vessel"
order: 1
xp: 500
difficulty: 5
minutes: 50
requires: []
skills: ["recon", "idor", "auth"]
attributes: { recon: 2, exploitation: 3, logic: 2 }
summary: "One app, no telling what it hides. Take it apart on disk, defeat its pinning, break its API, and read what it left on the device. The final trial of the Glass Coast."
---

You are handed one file — `vessel.apk` — and nothing about where it breaks. This is a mobile assessment as it arrives: a single package, and the whole Glass Coast to walk on it. Take it apart, get on its wire, break its backend, and read what it trusted the device to keep.

## Open the ship

You rename the APK and unzip it, then run strings and open it in jadx.

```question
id: unpack
prompt: You have vessel.apk and want to read its manifest, hardcoded strings and code before running it. At its core an APK is what kind of file you can simply unzip?
answer: a zip
accept: [a zip, a zip archive, a zip file, an archive, zip]
hint: Rename it and unzip it.
```

Inside, strings reveals a hardcoded key `AIzaSy...` and an internal backend `api-internal.vessel.com`, and the manifest shows `AdminActivity` marked exported.

## Get on the wire

You set your proxy, but the app will not connect — it only trusts its own baked-in certificate.

```question
id: pinning
prompt: The app refuses your proxy's certificate because it only trusts the one shipped inside it. What defence is that, which you will strip with Frida or Objection?
answer: certificate pinning
accept: [certificate pinning, cert pinning, ssl pinning, pinning]
hint: The app pins the certificate.
```

With pinning hooked off on your own device, the traffic flows into Burp.

## Break the backend

The app's requests go to `api-internal.vessel.com`. You read an order at `/api/v1/orders/8241`, then, from a second test account, request the same id.

```question
id: bola
prompt: From a second account you request the first account's order at /api/v1/orders/8241 and it returns with a 200. The mobile backend never checked ownership. What API vulnerability is that?
answer: BOLA
accept: [bola, broken object level authorization, idor, insecure direct object reference]
hint: The app's backend is an API, and this is its top bug.
```

## Walk the side door

The manifest showed `AdminActivity` exported. You launch it directly with adb.

```question
id: exported
prompt: You run adb shell am start on the exported AdminActivity and the admin screen loads without logging in, because only the login screen enforced auth. Reaching a protected screen by launching its exported component directly is a failure of what?
answer: authorization
accept: [authorization, access control, the authorization check, a missing auth check, access-control check, missing authorization]
hint: The screen trusted the login screen to gate it.
```

## Read what it hid

On the rooted device you open the app's data directory and find the session token sitting in a plain SharedPreferences XML file.

```question
id: storage
prompt: The app's auth token is stored in a plaintext SharedPreferences file rather than the Keystore, readable on your rooted device. What class of mobile flaw is that?
answer: insecure storage
accept: [insecure storage, insecure data storage, insecure local storage, plaintext storage, insecurely stored data]
hint: Sensitive data kept unencrypted on a device you control.
```

## Follow the link inward

A deep link `myapp://open?url=` loads any URL into a WebView that has file access enabled. You point it at the app's own database file.

```question
id: webview
prompt: A deep link loads an attacker URL into a file-access-enabled WebView, and you pass a file:// path to the app's database. What does the loosely-configured WebView let your page do?
answer: read local files
accept: [read local files, read the app's files, access private storage, read the database, steal local files, read app storage]
hint: File access plus an attacker-chosen URL reads the device's files.
```

## Report by impact

You hold a hardcoded key, BOLA on the backend, an exported admin screen, an insecurely stored token, and a WebView that reads local files. You lead with the greatest impact and disclose responsibly.

```question
id: lead
prompt: Between a cosmetic UI issue and the BOLA that lets any user read every customer's orders from the backend, which finding leads your mobile assessment report?
answer: the BOLA
accept: [the bola, bola, the backend bola, the idor, the one exposing all orders, the api authorization bug]
hint: Lead with the greatest demonstrated impact.
```

> One file, walked end to end: you unzipped the ship, stripped its pinning, broke its API from a second account, walked through the exported door, read the token it left in the clear, and turned a deep link into local-file theft — then reported by impact. The Glass Coast is behind you.
