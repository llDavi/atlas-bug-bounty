---
slug: "api-the-endpoint-with-no-guard"
title: "The Endpoint With No Guard"
kingdom: "api"
place: "sealed-passes"
order: 2
xp: 240
difficulty: 2
minutes: 30
requires: []
skills: ["auth"]
attributes: { exploitation: 2, logic: 2 }
summary: "Auth on an API is applied endpoint by endpoint, so it is forgotten endpoint by endpoint. The unguarded route, the version that lost its check, the refresh token that never dies."
---

A website has one login and one session guarding everything behind it. An API guards each endpoint separately, which means each endpoint can *forget* its guard separately. Broken authentication on APIs is rarely a broken login — it is one route out of two hundred that nobody put a check on.

## The one they forgot

A team adds authentication to every endpoint through a middleware — except the three that were added later, by hand, and slipped the net:

```
GET /api/v1/users        -> 401 (guarded)
GET /api/v1/orders       -> 401 (guarded)
GET /api/v1/internal/metrics -> 200 (no guard)
GET /api/v2/export       -> 200 (no guard)
```

`internal/metrics` and `export` answer with no token because their guard was never wired up. The method is dull and pays: send every enumerated endpoint with no credentials and note which ones still answer.

```question
id: forgotten-guard
prompt: Most endpoints return 401 without a token, but /api/v2/export returns 200 with data and no token. Why does auth get forgotten on individual API endpoints far more often than on a website's single login?
answer: auth is applied per endpoint
accept: [it is per endpoint, each endpoint is guarded separately, auth is applied endpoint by endpoint, per-route authentication, one route can miss the check, each route needs its own guard]
hint: Two hundred separately-guarded routes means two hundred chances to forget.
```

## The guard that changed between versions

The same forgetting happens across versions and methods. `GET /api/v2/users/1024` requires auth, but `GET /api/v1/users/1024` — or `HEAD`, or `OPTIONS` — may not, because the guard was attached to one version or one verb and not the others.

```question
id: version-guard
prompt: The v2 endpoint demands a token but the still-deployed v1 of the same route returns data with none. What earlier lesson's habit does this reward — trying which variants of a route?
answer: older versions
accept: [older versions, previous versions, try v1, the older version, earlier versions, different versions]
hint: The guard was wired to the new version and left off the old one.
```

## OAuth on the API, and the scope you request

APIs delegate login to OAuth just like the web. The API-specific abuse is over-broad scope: an app requests far more permission than it needs, so a compromised or malicious client holds a token that can do far more than the feature warranted. When you connect a third-party app, read the scopes it asks for.

```question
id: oauth-scope
prompt: A note-taking integration asks for an OAuth token with permission to read and delete all your files, though it only needs to create notes. What is the security problem with the scope it requested?
answer: it is over-broad
accept: [it is too broad, over-broad scope, excessive scope, too many permissions, overprivileged, more scope than needed, over-permissioned]
hint: It asked for far more permission than the feature requires.
```

## The token that outlives its welcome

APIs hand out short access tokens and long **refresh tokens** that mint new ones. Two common flaws: a refresh token that is not invalidated on logout or password change (so a stolen one keeps working forever), and an access token with no real expiry. Test whether logging out, or changing the password, actually kills a token you captured beforehand.

```question
id: refresh
prompt: You capture a token, then log out and change your password, then replay the old token — and it still works. What did the server fail to do on logout or password change?
answer: invalidate the token
accept: [invalidate the token, revoke the token, expire the token, kill the session, invalidate it, revoke it, invalidate the old token]
hint: A logout or password change should revoke tokens issued before it.
```

> API authentication fails one endpoint at a time. Send everything with no token to find the unguarded route, try the old version and other verbs to find the guard that moved, read the scopes an integration demands, and check that logout and password change actually revoke a token you already hold.
