---
slug: "mobile-the-emerald-docks"
title: "The Emerald Docks"
kingdom: "mobile"
place: "emerald-docks"
order: 1
xp: 260
difficulty: 3
minutes: 35
requires: []
skills: ["idor"]
attributes: { exploitation: 2, logic: 2 }
summary: "Android apps are built from components that talk to each other with intents — and any component marked exported can be talked to by your app, or by adb, from outside."
---

An Android app is not one program but a set of **components** — Activities (screens), Services (background work), Broadcast Receivers (event handlers), and Content Providers (data stores) — that communicate through messages called **intents**. The bug surface is simple to state: any component the manifest marks `exported` can be invoked from *outside* the app, and developers export things they meant to keep private.

## Launching a screen you never logged into

An Activity is a screen. If `AdminActivity` is exported, another app — or you, with `adb` — can start it directly, skipping whatever screen was supposed to come first (the login):

```
adb shell am start -n com.app/.AdminActivity
```

If the admin screen loads without a session because the *login* Activity was the only thing checking auth, you have walked in the side door. Every exported Activity is a "can I reach this without the steps before it?" test.

```question
id: exported-activity
prompt: The app's AdminActivity is exported, and adb shell am start launches it directly, showing the admin screen without going through login. What flaw is reaching a protected screen by launching its exported component directly?
answer: a missing authorization check
accept: [missing authorization, no auth check on the activity, broken access control, missing access control, the activity does not check auth, exported without authorization, authorization bypass]
hint: The screen trusted the login screen to gate it, and you skipped that screen.
```

## The provider that answers queries

A Content Provider exposes data through `content://` URIs, and an exported one answers *your* queries. Two classic bugs: it hands over data with no permission check, and — because providers run database queries — its selection argument can be **SQL-injectable**, or its file-backed URIs **path-traversable**:

```
content://com.app.notes/notes                      -> all notes, no auth
content://com.app.files/../../databases/users.db    -> traversal to another file
```

```question
id: content-provider
prompt: An exported Content Provider at content://com.app.notes/notes returns every user's notes to any app that queries it, with no permission check. Besides leaking data, providers run database queries, so what injection should you also test in the query's selection argument?
answer: SQL injection
accept: [sql injection, sqli, injection]
hint: The provider is backed by a database, and you control the selection.
```

## Broadcasts and services from outside

Exported **Receivers** accept broadcasts you send (`adb shell am broadcast`), which can trigger privileged actions the app assumed only the system would fire — "mark premium", "apply config". Exported **Services** can be started or bound with crafted intents to invoke internal operations. The manifest listed each; you send the intent it did not expect.

```question
id: receiver
prompt: An exported Broadcast Receiver performs a privileged action when it receives a certain broadcast, and you send that broadcast yourself with adb. What did the developer wrongly assume about who could send that intent?
answer: only the system could send it
accept: [only the system, that only the app could send it, only trusted senders, that it was internal, only the os would send it, that outsiders could not send it]
hint: Exported means anyone can fire the intent, not just the system.
```

## The method is the manifest

None of this is guesswork: you read the exported components out of `AndroidManifest.xml`, then reach each one from outside with `adb` or a small test app, checking whether it enforces its own permission. The exported flag is the whole map of the app's external attack surface.

```question
id: method
prompt: To find these Android IPC bugs systematically, which single file do you read first to list every component that is reachable from outside the app?
answer: AndroidManifest.xml
accept: [androidmanifest.xml, the manifest, the android manifest, androidmanifest]
hint: It declares every component and whether each is exported.
```

> An Android app is components trading intents, and the exported ones trade with anyone. Launch the Activity that skips the login, query the Provider that forgot its permission, fire the broadcast the app thought only the system could send — all read straight off the manifest, all reachable with adb.
