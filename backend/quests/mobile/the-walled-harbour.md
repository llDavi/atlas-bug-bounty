---
slug: "mobile-the-walled-harbour"
title: "The Walled Harbour"
kingdom: "mobile"
place: "walled-harbour"
order: 1
xp: 250
difficulty: 3
minutes: 30
requires: []
skills: ["auth"]
attributes: { recon: 1, logic: 2 }
summary: "iOS builds higher walls — a strict sandbox, a real Keychain — but the same mistakes leak through: data in the wrong store, a URL scheme any app can claim, a WebView left loose."
---

iOS is the walled harbour: a strict sandbox isolates each app, and the **Keychain** offers genuinely protected storage. But strong walls make developers careless about the gaps, and the same classes recur — sensitive data in the wrong place, a deep-link scheme another app can steal, a WebView configured too loosely.

## The Keychain, and the store that is not it

iOS gives apps the Keychain for secrets — encrypted, hardware-backed. But `NSUserDefaults` and `Info.plist`-style storage are just files in the sandbox, readable on a jailbroken device or from an unencrypted backup. A token in `NSUserDefaults` instead of the Keychain is the iOS version of the Android SharedPreferences mistake.

```question
id: keychain
prompt: An iOS app stores the auth token in NSUserDefaults rather than the Keychain. Why is that insecure — what is NSUserDefaults, underneath?
answer: a readable file
accept: [a plaintext file, a readable plist, just a file, an unencrypted file, a plist file, readable storage, a plain file in the sandbox]
hint: Unlike the Keychain, it is a plain property-list file in the app's sandbox.
```

Even in the Keychain, the **accessibility** attribute matters: an item set `AccessibleAlways` can be read without the device being unlocked, which weakens the protection the Keychain was supposed to give.

## The scheme any app can claim

iOS custom URL schemes (`myapp://`) have a flaw by design: **any app can register the same scheme**. A malicious app that claims `bankapp://` can receive deep links meant for the real one — including any secret (an OAuth code, a token) passed through the link. This is URL scheme hijacking.

```question
id: scheme-hijack
prompt: On iOS a malicious app registers the same custom URL scheme as a banking app, so deep links carrying an OAuth code to bankapp:// may be delivered to the attacker's app instead. What weakness of custom URL schemes makes this possible?
answer: any app can claim the scheme
accept: [any app can register the scheme, schemes are not unique, multiple apps can claim it, no ownership of schemes, another app can register it, schemes can be claimed by any app]
hint: Nothing ties a custom scheme to one app.
```

## The safer door: universal links

**Universal links** (`https://app.com/...` that open the app) fix this: they are verified against a file the developer hosts on their domain, so only the real owner's app can claim them. When you see secrets passed over a custom scheme instead of a universal link, that is the finding.

```question
id: universal
prompt: Which iOS deep-linking mechanism is verified against a file on the developer's own domain, so a malicious app cannot claim it — the safer alternative to custom URL schemes?
answer: universal links
accept: [universal links, universal link, a universal link]
hint: They use a real https domain the developer must prove they own.
```

## The same loose WebView

iOS `WKWebView` carries the same risks as Android's: loading an attacker URL from a deep link, enabling file access, or bridging JavaScript to native via message handlers. The filenames differ; the bugs — WebView XSS with device reach, local file access, a JS-to-native bridge — are the ones you already know.

```question
id: ios-webview
prompt: An iOS WKWebView loads a URL taken from a deep link and has a JavaScript-to-native message handler. Are the resulting risks fundamentally different from the Android WebView bugs, or the same classes with different names?
answer: the same classes
accept: [the same, the same classes, the same bugs, no different, the same with different names, same classes different names]
hint: XSS, file access, and a native bridge — renamed, not reinvented.
```

> The walls are higher on iOS, so the gaps are what pay: a secret in NSUserDefaults instead of the Keychain, a scheme any app can hijack where a universal link belonged, a WKWebView left as loose as any other. Strong sandboxes breed careless developers.
