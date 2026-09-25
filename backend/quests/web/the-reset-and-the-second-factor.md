---
slug: "the-reset-and-the-second-factor"
title: "The Reset and the Second Factor"
kingdom: "web"
place: "the-gatehouse"
order: 2
xp: 260
difficulty: 3
minutes: 35
requires: []
skills: ["auth"]
attributes: { exploitation: 2, logic: 2 }
summary: "The forgotten-password flow is a second way in, and MFA is only as strong as the endpoint behind it. Both fail in ways you can see in one request."
---

The login form is not the only door. The **password reset** flow can hand out an account without a password, and **multi-factor** authentication protects nothing if the endpoint behind it can be skipped. Both are logic flows, and both leak in a single intercepted request.

## Poisoning the reset link

When you ask to reset a password, the server emails you a link. It has to build the domain of that link from somewhere — and a careless app builds it from the **Host header of your request**. Change the Host, and the reset email points at your server:

```http
POST /forgot-password HTTP/1.1
Host: evil.attacker.com
Content-Type: application/x-www-form-urlencoded

email=victim@target.com
```

The victim gets a real email from the real app, but the reset link is `https://evil.attacker.com/reset?token=…`. When they click it, the secret token lands on the attacker's server. This is **host header injection** in the reset flow — a full account takeover from one changed header.

```question
id: host-reset
prompt: A forgotten-password request for the victim's email is sent with the Host header changed to evil.attacker.com, and the reset link in the victim's email now points there. Which request header did the app trust to build that link?
answer: Host
accept: [the host header, host header, host]
hint: The app built the link's domain from the request instead of a fixed value.
```

## The token that answers for anyone

Even with a fixed domain, the reset **token** itself is often the flaw: it is sequential, or short, or tied to nothing. The tell is comparing two reset tokens issued seconds apart:

```
reset1 = 100418
reset2 = 100419
```

Sequential six-digit tokens are guessable in minutes with no rate limit. And watch the *second* request — some flows send the token in the reset-submit and also let you send an `email=` or `user_id=` field, so you reset the token you were given but point it at a different account.

```question
id: reset-token
prompt: Two password-reset tokens requested moments apart come back as 100418 and 100419. What property makes those tokens exploitable, especially with no rate limit on the reset page?
answer: they are sequential
accept: [sequential, predictable, guessable, they are predictable, sequential and guessable, not random]
hint: You can guess the next one without seeing it.
```

## The second factor you can walk around

MFA feels strong, but it is only a check on one endpoint, and apps forget that. Three real bypasses, all visible in the proxy:

- The OTP page posts to `/verify-otp`, but the account is *already logged in* — browsing straight to `/dashboard` after the password step, skipping OTP entirely, just works.
- The `/verify-otp` response is `{"success": false}` in a 200 you can flip to `true`.
- The OTP itself has no rate limit, so a 6-digit code is 1,000,000 guesses — brute-forceable.

The habit: after the password step, do not enter the code — try to reach the protected page directly first.

```question
id: mfa-skip
prompt: After the password step, instead of entering the OTP you browse straight to /dashboard, and it loads — the app logged you in at the password stage and only *showed* an OTP screen. What did the app fail to do?
answer: enforce the second factor
accept: [enforce mfa, enforce the otp, require the otp, actually check the second factor, gate the session on mfa, enforce the second step]
hint: The OTP was a screen, not a gate on the session.
```

## Remember-me, remembered too well

A "remember me" cookie is a long-lived credential. If it is a predictable value (the username base64-encoded, `YWxpY2U=`) rather than a long random token tied to the session, an attacker forges it for any user.

```question
id: remember
prompt: A "remember me" cookie decodes from base64 to just the username, like YWxpY2U for alice. Why is that a takeover risk?
answer: it can be forged for any user
accept: [you can forge it, forge it for anyone, guessable, predictable, encode another username, set it to another user, it is not random]
hint: If the cookie is only the username encoded, you can encode someone else's.
```

> The reset flow and the second factor are two more front doors. Trust the wrong header and the reset link goes to the attacker; issue a sequential token and it is guessed; treat MFA as a screen instead of a gate and it is walked around. Every one of these is a logic error you can see in a single request.
