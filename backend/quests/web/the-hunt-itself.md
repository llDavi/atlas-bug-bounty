---
slug: "the-hunt-itself"
title: "The Hunt Itself"
kingdom: "web"
place: "cartographers-tower"
order: 2
xp: 260
difficulty: 3
minutes: 35
requires: []
skills: ["logic"]
attributes: { logic: 3, patience: 1 }
summary: "The method behind the payloads: forming a hypothesis, chasing the anomaly, chaining small bugs into a big one, and refusing to report what you have not proven."
---

Payloads are the vocabulary; the hunt is the grammar. Good hunters do not fire everything at everything — they form a hypothesis, follow the response that does not fit, and chain small findings until the impact is undeniable. And they never send a report they have not verified, because a false positive costs their reputation more than a missed bug costs the program.

## Testing a hypothesis, not everything

Random fuzzing finds the shallow. Depth comes from a hypothesis: *this order id is in the URL and the app is a marketplace, so the seller and buyer views may not check ownership — let me test IDOR on the seller endpoint specifically.* You aim tests at where the design makes a flaw likely, then confirm or discard.

```question
id: hypothesis
prompt: Rather than firing every payload at every field, a strong hunter reasons "this design makes a certain flaw likely here" and tests that. What is this approach called?
answer: hypothesis-driven testing
accept: [hypothesis-driven, hypothesis driven testing, testing a hypothesis, hypothesis-based testing, reasoning first]
hint: You form a theory about where a bug lives, then test the theory.
```

## Following the response that does not fit

The best signal is anomaly: a `500` where every other input gave `200`, a request that takes five seconds when the rest take fifty milliseconds, a value reflected where you did not expect it, an error message that names a database. These are the app leaking its internals. Chase the odd one out instead of moving on.

```question
id: anomaly
prompt: While testing, one input returns a 500 error and a stack trace when everything else returns a clean 200. What should you do with that anomaly?
answer: investigate it
accept: [investigate, dig into it, follow it, it is a signal, chase it, look closer, investigate further]
hint: The app just leaked something about how it works internally.
```

## Chaining small into large

A single low-severity bug is often a stepping stone. An open redirect (low) plus an OAuth flow with a loose `redirect_uri` becomes theft of the authorization code — an account takeover (critical). Triagers pay for the chain, not the parts: two "informational" findings can combine into the report of the month.

```question
id: chaining
prompt: On its own an open redirect is low severity, but combined with a loose OAuth redirect it lets you steal a victim's login code and take over their account. What did combining the two bugs do to the overall severity?
answer: it raised it
accept: [raised it, increased the severity, made it critical, escalated it, made it high, raised the impact, turned low into critical]
hint: Small bugs chained together produce a large one.
```

## Proving impact, and not crying wolf

Two habits mark a professional. First, **assess real impact** — not "XSS exists" but "XSS in the admin ticket view steals the admin session, enabling full account takeover." Second, **verify before reporting**: an `alert(1)` that only fires when *you* paste it into your own console is self-XSS, not a vulnerability. Confirm a real attacker path exists, or do not send it.

```question
id: self-xss
prompt: You can only trigger a script by pasting it into your own browser's developer console; no attacker can make a victim do that. Is that a reportable cross-site scripting vulnerability?
answer: no
accept: [no, no it is self-xss, self-xss, not reportable, no it is not exploitable, it is only self-xss]
hint: If only the victim pasting into their own console triggers it, there is no attacker path.
```

> The hunt is reasoning, not luck: aim tests where the design invites a flaw, chase every anomaly the app leaks, chain the small bugs into the impactful one, and prove a real attacker path before you ever write it up. The payloads are the same for everyone; the method is what finds and stands up a bug.
