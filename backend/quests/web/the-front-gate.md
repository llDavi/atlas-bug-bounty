---
slug: "the-front-gate"
title: "The Front Gate"
kingdom: "web"
place: "the-gatehouse"
order: 1
xp: 240
difficulty: 2
minutes: 35
requires: []
skills: ["auth"]
attributes: { exploitation: 2, logic: 1 }
summary: "Login and registration are where an app first decides who you are — and where it most often decides wrong: leaked usernames, no rate limit, and the bypass hiding in a status code."
---

The gate's whole job is to answer one question — *are you who you say you are?* — and it answers it badly more often than any other part of an app. The bugs are rarely cryptographic; they are logic. The gate tells you which names are real, lets you guess passwords forever, or trusts a value it should never have trusted.

## The gate that names its members

A login should give the same answer whether the username exists or not. Many do not. Compare the two responses from the last chapter's tool:

```
username=alice&password=x  ->  200, "Incorrect password"
username=zzzzz&password=x  ->  200, "No account with that email"
```

The app just sorted the world into *real accounts* and *not*. Registration and password-reset forms leak it too ("email already in use"). That is **username enumeration** — the first half of every credential attack, because now you only guess passwords for names you know are real.

```question
id: enum
prompt: A login says "Incorrect password" for alice but "No account with that email" for a random name. What does that difference hand an attacker before they have guessed a single password?
answer: username enumeration
accept: [a list of valid usernames, valid usernames, which accounts exist, user enumeration, enumerate users]
hint: The app confirms which accounts are real.
```

## The gate you can knock on forever

Once you know a name is real, the only thing between you and the account is how many guesses the gate allows. A login with no **rate limit** and no lockout lets Intruder run a password list unbounded:

```
POST /login   username=alice&password=§FUZZ§
# 50,000 requests, all 200, one of them without the "Incorrect password" string
```

Worse and common: rate limits enforced *per IP but not per account*, or enforced on the login page but not on a JSON `/api/login`. The bug report is "no protection against credential brute force on {endpoint}".

```question
id: rate-limit
prompt: A login endpoint returns "Incorrect password" 50,000 times with no lockout, delay, or CAPTCHA ever appearing. Which protection is missing, making credential brute-force possible?
answer: rate limiting
accept: [rate limit, a rate limit, brute-force protection, lockout, rate-limiting, no rate limit]
hint: Nothing ever slowed the guessing down.
```

## The bypass in the status code

Sometimes the gate checks your password correctly and then *ignores its own answer*. A classic: the server sends a 302 redirect to `/login` on failure but the page body already contains the logged-in dashboard, or an API returns `{"authenticated": false}` in a 200 you can flip. In a proxy you catch the response and change one value:

```http
HTTP/1.1 200 OK

{"authenticated": false, "role": "guest"}
```

Change `false` to `true` (or drop the 302 and read the body underneath) and the client treats you as logged in — because the *client* decided, not the server. That is an **authentication bypass** through trusting a client-side check.

```question
id: bypass
prompt: On a wrong password the server still returns a 200 whose body says authenticated false, and the browser only redirects because of that value. Editing the response to authenticated true logs you in. What class of flaw is that?
answer: authentication bypass
accept: [auth bypass, authentication bypass, client-side auth check, broken authentication]
hint: The real check was left to the client, and you control the client.
```

## Passwords the policy let through

Registration is a quieter source of findings: a **password policy** that accepts `123456`, or one enforced only in JavaScript (strip it in the proxy and set any password). And the reverse — a maximum length that is suspiciously short (say 16) can hint the password is stored, not hashed, since a proper hash does not care about length.

```question
id: js-policy
prompt: The registration form rejects weak passwords in JavaScript, but after you intercept the request and send password=123456 straight to the server, the account is created. Where was the policy actually enforced?
answer: only in the client
accept: [client-side, only client-side, in javascript, only in javascript, the browser, client side only]
hint: The proxy sits after the browser's checks.
```

> The front gate fails on logic, not maths. It tells you who is real, lets you guess without limit, trusts a value the client controls, or waves through a password its own rules forbid. Read what the gate *decides* and where it decides it — half the time the decision is yours to make.
