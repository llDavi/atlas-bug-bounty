---
slug: "weighing-what-was-never-weighed"
title: "Weighing What Was Never Weighed"
kingdom: "web"
place: "merchants-scales"
order: 1
xp: 280
difficulty: 3
minutes: 35
requires: []
skills: ["logic"]
attributes: { logic: 3, exploitation: 1 }
summary: "No payload here — just numbers the app never expected. The price you set, the quantity that goes negative, the coupon used a hundred times. Business logic bugs are found by asking what the developer assumed."
---

Business logic flaws carry no injection and no special character. They are the app doing exactly what it was told, because nobody weighed what would happen if a merchant offered *less than nothing*. You find them not with a scanner but by reading a workflow and asking: what did the developer assume, and what if I do the opposite? These bugs are invisible to tools and pay well because they are unique to the target.

## The price the client was allowed to set

The clearest one: the checkout sends the price from the browser, and the server trusts it. Intercept the request:

```http
POST /cart/checkout HTTP/1.1

{"item":"laptop","price":1299.00,"qty":1}
```

Change `price` to `1.00`, or `0.01`, and if the order goes through the server never had a trusted price of its own — it took yours. The developer assumed the price field was theirs; it crossed a **trust boundary** into your hands the moment it went to the browser.

```question
id: price
prompt: A checkout request contains the item's price as a field, and changing it from 1299.00 to 1.00 completes the order at your price. What did the server wrongly trust?
answer: the client's price
accept: [the price from the client, client-supplied price, the price field, a client-controlled value, the browser's price, input from the client]
hint: The price should come from the server's own records, never the request.
```

## The number that goes below zero

Developers guard the top of a range and forget the bottom. A quantity field validated as "not too many" but not "at least one" lets you send a **negative quantity**, and negative times price is a negative total — the app *credits* you:

```
{"item":"laptop","price":1299.00,"qty":-3}   ->  order total: -3897.00  (refunded to your balance)
```

The same blindness shows up as coupons that make a total negative, or point balances that underflow. Always try zero and a negative where a positive was expected.

```question
id: negative
prompt: A quantity field is checked for being too large but never for being at least one, so sending a quantity of -3 produces a negative total that credits your account. What value did the developer forget to reject?
answer: a negative number
accept: [negative, negative values, negative quantity, values below zero, below zero, a negative quantity]
hint: They guarded the top of the range, not the bottom.
```

## The coupon with no memory

A discount code is meant to be used once. If the app checks the code is *valid* but not whether *this user already used it* — or lets you apply it several times in one order — you stack it to free:

```
apply SAVE20 ... apply SAVE20 ... apply SAVE20   ->  60% off, then 100%
```

The assumption was "one coupon per order"; the code enforced "the coupon exists". That gap between the intended rule and the coded rule is where every business-logic bug lives.

```question
id: coupon
prompt: A 20%-off code can be applied to the same order several times, stacking to 100% off, because the app checks the code is valid but not that it was already applied. In one phrase, what is the general lesson these business-logic bugs teach?
answer: the coded rule differs from the intended rule
accept: [the code does not enforce the intended rule, missing a check the business assumed, the app enforces the wrong rule, the assumption was not enforced, intended rule not coded, a missing business rule, the gap between intended and coded rules]
hint: The developer's assumption was never turned into an actual check.
```

## How you find them at all

There is no signature to grep for. You map the workflow — cart, discount, payment, confirmation — and at each step ask what value the client controls and what the app assumes about it. Then you send the value the app never imagined: the negative, the zero, the repeat, the out-of-order step. Reading the intended flow is the whole technique.

```question
id: method
prompt: Business logic flaws have no payload and no scanner signature. What is the actual method for finding them?
answer: read the workflow and question the assumptions
accept: [understand the workflow, map the flow and test the assumptions, question what the developer assumed, read the logic and try the unexpected value, think about the intended rules, analyse the business flow]
hint: You reason about the intended flow, then do the thing it did not plan for.
```

> No exploit, just arithmetic the app trusted. Set the price, drive the quantity below zero, use the coupon it forgot to remember. Read the workflow, find the assumption, and send the value the developer was sure no one would.
