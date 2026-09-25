---
slug: "tokens-and-third-parties"
title: "Tokens and Third Parties"
kingdom: "web"
place: "the-gatehouse"
order: 3
xp: 280
difficulty: 3
minutes: 40
requires: []
skills: ["auth"]
attributes: { exploitation: 2, logic: 2 }
summary: "Stateless tokens and 'Sign in with Google' move the trust around, and every place the trust moves is a place to break it: JWT claims, OAuth redirect_uri, and account linking."
---

Modern auth spreads the trust out — into a self-describing token, or into a third party like Google or GitHub. Each handoff is a seam. This lesson is about breaking the seams: the claims inside a JWT, the redirect a login provider will follow, and the moment two accounts get linked into one.

## The token that trusts itself

A JWT carries its own claims and a signature over them. The attacks all come down to *making the server trust a claim it should have verified*. You met `alg: none` already; the sharper one is **algorithm confusion**. A token signed with RS256 uses a private key to sign and the server's public key to verify. If the server can be tricked into treating that public key as an HMAC secret, you sign your own token with the *public* key — which you have — and it verifies.

And never forget the simplest: the payload is readable and often over-trusted.

```
{"sub":"1024","email":"alice@target.com","isAdmin":false}
```

```question
id: jwt-claim
prompt: A JWT payload contains isAdmin false and the server reads that claim to grant admin. Where must the check that a user is really an admin actually happen — inside the client's token, or on the server against its own records?
answer: on the server
accept: [server-side, the server, against the database, the backend, server side]
hint: A claim the user carries is a claim the user can try to forge; the server must not simply believe it.
```

## The redirect a login provider will follow

"Sign in with Google" (OAuth) sends you to the provider, which sends you back to a `redirect_uri` with a secret `code`. If the app does not strictly pin that `redirect_uri`, an attacker changes it and the code — the key to the victim's session — is delivered to them:

```
https://target.com/oauth/authorize?client_id=abc
    &redirect_uri=https://evil.attacker.com/callback
    &response_type=code
```

If `redirect_uri` is accepted loosely (a substring match, or an open redirect on the real domain forwards it onward), the victim logs in and their `code` lands on `evil.attacker.com`. The whole OAuth handoff hangs on that one value being locked down.

```question
id: oauth-redirect
prompt: In an OAuth login, the parameter that decides where the provider sends the secret authorization code is changed to evil.attacker.com and the app accepts it. Which parameter must be strictly validated to prevent the code being stolen?
answer: redirect_uri
accept: [redirect uri, the redirect_uri, redirecturi, redirect-uri]
hint: It is the callback address the provider returns the code to.
```

## The state that stops the forgery

OAuth carries a `state` parameter whose job is to tie the request that started the login to the response that finishes it — a CSRF token for the flow. If the app ignores `state`, an attacker can stitch *their* login response onto *your* session, silently logging you into the attacker's account (or linking it).

```question
id: oauth-state
prompt: An OAuth flow does not check the state parameter it sent when the provider redirects back. Which class of attack does the state parameter exist to prevent?
answer: CSRF
accept: [cross-site request forgery, login csrf, csrf on the oauth flow]
hint: It binds the finishing response to the request that started it.
```

## The two accounts that become one

Apps let you link a social login to an existing account by email. The dangerous version: the app links whatever email the provider reports **without verifying you control it**, or matches on an email that was never confirmed. An attacker registers `victim@target.com` (unverified), later the victim signs in with Google for the same email, and the two are merged — the attacker's password now opens the victim's account. This is **pre-account-takeover** through unsafe account linking.

```question
id: linking
prompt: An attacker registers an account with victim@target.com but never verifies it; later the victim signs in with Google for that same email and the app merges the two into one account. What made this possible?
answer: unverified email
accept: [the email was never verified, no email verification, unverified account linking, linking on an unverified email, missing email verification]
hint: The merge trusted an email address nobody had proven they owned.
```

> Every modern login moves the trust somewhere — into a token's claims, into a provider's redirect, into an email used to link accounts. Break authentication by finding where the trust moved and asking the same question the whole realm asks: *did anyone actually verify this, or did they just believe it?*
