---
slug: "mobile-taking-the-ship-apart"
title: "Taking the Ship Apart"
kingdom: "mobile"
place: "taking-ship-apart"
order: 1
xp: 260
difficulty: 3
minutes: 35
requires: []
skills: ["recon"]
attributes: { recon: 2, exploitation: 2 }
summary: "Two ways to take the ship apart: read the frozen code (static), or reach into the running app and change it (dynamic). Frida turns the second into rewriting the app as it runs."
---

Reverse engineering is how you reach the parts intercepting the traffic cannot. There are two modes: **static** — reading the app's code without running it — and **dynamic** — reaching into the live process to watch and change it. On a device you own, dynamic instrumentation lets you rewrite the app's behaviour in mid-flight, which is why so many mobile checks fall.

## Static: reading the frozen code

Static analysis decompiles the package and reads it. `jadx` turns Android DEX back into readable Java; Ghidra and `class-dump` handle iOS Mach-O binaries. You read the logic — how a token is signed, where a check happens, what an endpoint expects — without the app ever running.

```question
id: static
prompt: You open the app in jadx and read its decompiled code to understand how it signs its API tokens, without ever launching the app. What kind of analysis is that?
answer: static analysis
accept: [static, static analysis, static reverse engineering, static re]
hint: The code is frozen; you read it, you do not run it.
```

## Dynamic: reaching into the running app

Dynamic analysis attaches to the live process. **Frida** is the tool: it injects into the running app and lets you **hook** any function — read its arguments, change its return value, replace it entirely — from a small script:

```javascript
// force a check to always pass
Java.perform(function() {
  var C = Java.use("com.app.security.LicenseCheck");
  C.isValid.implementation = function() { return true; };
});
```

That is how pinning, root detection, and license checks are defeated: you do not break the check, you *rewrite* it as the app runs. `Objection` wraps common Frida tasks (disable pinning, dump the keychain) in one-liners.

```question
id: frida
prompt: Using Frida you hook a license-check function in the running app and force it to always return true. What does dynamic instrumentation let you do to a function at runtime?
answer: change its return value
accept: [change its behaviour, change its return value, replace it, modify what it returns, override it, rewrite the function, force its result, hook and change it]
hint: You do not bypass the check; you rewrite what it returns.
```

## Watching secrets go by

Beyond changing behaviour, hooking lets you *observe*: hook the encryption function and print its plaintext argument, hook the signing routine and capture the key, hook the network call and read the body before pinning ever mattered. The running app performs the cryptography for you and you read it on the way through.

```question
id: hook-observe
prompt: Rather than cracking the app's encryption, you hook the function that encrypts data and print its input before it is encrypted. What does hooking let you capture that static analysis of the frozen code cannot?
answer: the runtime values
accept: [the runtime values, the plaintext, the actual data, the values at runtime, the real inputs, the secrets in memory, live values]
hint: The live process holds the plaintext and keys that the static code only describes.
```

## Putting it together

The full method: read the code statically to find the interesting function, then hook it dynamically to defeat or observe it. Static tells you *where*; dynamic gives you *control*. With both, no on-device check survives contact.

```question
id: combined
prompt: The standard reverse-engineering workflow uses both modes. What does static analysis provide that dynamic then acts on — in one word, static finds the ___ and dynamic controls it?
answer: where
accept: [where, the location, the function, the target, the place, the function to hook, where to hook]
hint: Reading the code shows you which function to reach into.
```

> Take the ship apart two ways: read the frozen code to find the check, then reach into the running app with Frida to rewrite or watch it. Because the process runs on hardware you command, dynamic instrumentation is the master key — every on-device secret and every on-device check yields to a hook.
