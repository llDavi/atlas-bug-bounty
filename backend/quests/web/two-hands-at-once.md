---
slug: "two-hands-at-once"
title: "Two Hands at Once"
kingdom: "web"
place: "merchants-scales"
order: 2
xp: 300
difficulty: 4
minutes: 35
requires: []
skills: ["logic"]
attributes: { logic: 3, exploitation: 1 }
summary: "Send the same request many times in the same instant and the app's 'check, then act' becomes 'check, check, check, act, act, act'. Race conditions, and the workflow steps you can simply skip."
---

An app checks a rule, then acts on it — *is the coupon unused? yes, so use it.* That works when requests arrive one at a time. Fire fifty at the exact same instant and every one of them checks *before* any of them acts, so all fifty pass a rule that should have allowed one. That gap between the check and the act is a **race condition**, and it turns single-use things into unlimited ones.

## The instant everyone passes the check

A gift card worth 100 is redeemed by: check balance, then deduct. Send twenty redemptions simultaneously (Burp's single-packet attack, or Turbo Intruder) and twenty of them read the balance as 100 before any deduction lands:

```
20 x  POST /redeem  {"card":"GC-100"}   (all in the same ~1ms)
->  balance credited 20 times: 2000 from a 100 card
```

The same shape drains coupons, "one per account" limits, follow/vote counts, and withdrawals. The fix is the app doing the check-and-act atomically (a database lock); the bug is that it did them as two steps.

```question
id: race
prompt: A 100 gift card is redeemed twenty times by sending all twenty requests in the same millisecond, because each reads the balance before any deduction is written. What class of vulnerability is that?
answer: race condition
accept: [race condition, a race condition, toctou, time-of-check to time-of-use]
hint: Requests race between the check and the act.
```

```question
id: single-packet
prompt: To win such a race you must make the requests arrive as close to simultaneously as possible. Sending them one after another in a loop usually fails — what do you need instead?
answer: send them simultaneously
accept: [parallel requests, simultaneous requests, concurrent requests, the single-packet attack, turbo intruder, fire them at once, all at the same time]
hint: They must hit the same instant, not a sequence.
```

## Paying once, receiving twice

A near-cousin is the **duplicate transaction**: submit the "confirm payment" or "transfer" request twice (resend, or double-click that the app did not guard) and the action happens twice from one authorisation — a second transfer, a doubled refund, two of a limited item. Idempotency keys exist to prevent this; their absence is the bug.

```question
id: duplicate
prompt: Re-sending the same "confirm transfer" request a second time performs the transfer twice from a single authorisation, because the app has no idempotency key. What is this flaw called?
answer: duplicate transaction
accept: [duplicate transaction, duplicate request, replay, missing idempotency, non-idempotent action, replay of the request]
hint: One approval, two effects.
```

## Skipping to the end of the workflow

Multi-step flows — cart, then address, then *payment*, then confirmation — assume you walk them in order. Often you can jump straight to the last step. Note the confirmation request and send it without ever paying:

```
POST /order/12345/confirm     (never called /order/12345/pay)
->  200 OK  order confirmed, unpaid
```

If the server does not verify the earlier steps happened, you have the goods without paying. This **workflow / state manipulation** — forcing an object into a state it should not reach — is business logic at its purest.

```question
id: workflow
prompt: An order flow expects cart, then payment, then confirm, but sending the confirm request directly — skipping payment entirely — marks the order complete. What did the server fail to verify?
answer: that the earlier steps happened
accept: [the previous steps, that payment occurred, the earlier steps of the flow, the order state, the prior steps, that the payment step was completed, the workflow order]
hint: It trusted you to walk the steps in order.
```

> Time and order are the two assumptions the merchant forgets. Collapse the time between check and act by firing at once, replay an action that should happen once, or skip to the step that was supposed to come last. None of it needs a payload — only doing two things at once, or in the wrong order.
