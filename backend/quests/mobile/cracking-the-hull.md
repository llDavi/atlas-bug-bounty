---
slug: "mobile-cracking-the-hull"
title: "Cracking the Hull"
kingdom: "mobile"
place: "breaking-the-hull"
order: 1
xp: 240
difficulty: 2
minutes: 35
requires: []
skills: ["recon"]
attributes: { recon: 3, logic: 1 }
summary: "Unzip the app and read what it was built from: the manifest that declares every door, the strings that hold the keys, the endpoints baked into the code."
---

Before you intercept a single request you can learn most of the app by taking it apart on disk. The manifest declares every component and permission; the compiled code and resources are full of hardcoded endpoints and secrets. Static analysis of the package is recon that never touches the target's servers.

## The manifest declares every door

`AndroidManifest.xml` (decoded with `apktool` or read in `jadx`) is the app's blueprint: every Activity, Service, Receiver and Provider, and crucially whether each is **exported** — reachable by other apps on the phone:

```xml
<activity android:name=".AdminActivity" android:exported="true"/>
<provider android:name=".NotesProvider"
          android:authorities="com.app.notes" android:exported="true"/>
```

An exported `AdminActivity` or `Provider` is a door another app can walk through — the seed of the IPC bugs in the Android chapter. Reading the manifest tells you the app's whole attack surface before you run it.

```question
id: exported
prompt: In AndroidManifest.xml an activity or provider has android:exported set to true. What does that attribute mean, and why does a hunter note every one?
answer: other apps can reach it
accept: [it is reachable by other apps, other apps can call it, exposed to other apps, other apps can access it, it can be launched by another app, reachable by any app]
hint: Exported components are callable from outside the app.
```

## The strings hold the keys

Developers hardcode more than they should, and `strings` (or grep through the decompiled `jadx` output) pulls it out — API keys, backend URLs, secrets, test credentials:

```
strings classes.dex | grep -iE 'key|secret|http|password'

https://api-internal.app.com/v1
AIzaSyD-9tSrke7abc123
firebase_db=app-1234.firebaseio.com
```

That Google key, that internal API, that open Firebase database — all extracted from the package, none requiring the app to run. This is exactly the JavaScript-analysis habit from the Web Realm, applied to compiled mobile code.

```question
id: strings
prompt: Running strings over the app's compiled code and grepping for key and http reveals a Google API key and an internal backend URL baked into the binary. What is the mobile name for this class of finding — credentials shipped inside the app?
answer: hardcoded secrets
accept: [hardcoded secrets, hardcoded credentials, hardcoded keys, embedded secrets, baked-in secrets, hardcoded api key]
hint: They are hardcoded into the package the user downloads.
```

## The iOS side of the same job

An IPA unzips to a `.app` folder holding a Mach-O binary and `Info.plist`. The plist declares the app's **URL schemes** (custom `myapp://` links) and its capabilities; the binary is read with `strings`, `class-dump` or Ghidra. The entitlements file lists what the app is allowed to do. Same idea, different filenames.

```question
id: ios-plist
prompt: On iOS, which file inside the unzipped app declares the app's configuration, including the custom URL schemes like myapp:// that other apps and links can use to open it?
answer: Info.plist
accept: [info.plist, the info.plist, the plist, infoplist]
hint: It is the property list at the root of the .app bundle.
```

## Endpoints are your API map

Every backend URL you pull from the package is a route into the API kingdom. Before intercepting anything, you already have a list of hosts and paths the app talks to — including staging and internal APIs the mobile app calls but the website never does.

```question
id: endpoints
prompt: Static analysis of the app reveals it calls api-internal.app.com, a backend the public website never contacts. Why is an endpoint found only in the mobile app especially worth testing?
answer: it is less tested
accept: [it is less exposed, fewer people test it, mobile-only endpoints are less tested, internal and less guarded, it is not on the website, less scrutinised, a hidden backend]
hint: A backend only the app knows about gets far less attention than the public site.
```

> Take the app apart before you run it. The manifest hands you every exported door, the strings hand you the hardcoded keys, and the code hands you the backends — including the internal ones only the app talks to. Static analysis is free recon the target never sees.
