---
slug: "api-no-limit"
title: "No Limit"
kingdom: "api"
place: "toll-roads"
order: 1
xp: 260
difficulty: 3
minutes: 30
requires: []
skills: ["logic"]
attributes: { exploitation: 2, logic: 2 }
summary: "APIs are built to be hit fast by machines, and they forget to say no. Missing rate limits turn guessing into certainty, one expensive query into a denial of service, and check-then-act into a race."
---

An API expects to be called by software, often thousands of times a minute — and just as often forgets to limit how *you* call it. Missing limits are not a small bug on an API: no rate limit turns every guess into a certainty, one heavy request into an outage, and every "check then act" into a race the attacker wins.

## No rate limit turns guessing into certainty

The OTP, the coupon, the password, the object id — all are guessable when the API answers unlimited attempts. A 6-digit OTP with no limit is a million tries, minutes of work:

```
POST /api/v1/verify-otp   {"otp": "000000"}  ...  {"otp": "999999"}
# 1,000,000 requests, none blocked
```

Rate limiting is the control that makes brute force impractical; its absence is a reportable finding on its own, and the enabler of half the others.

```question
id: no-rate-limit
prompt: A 6-digit OTP endpoint accepts unlimited attempts with no delay, lockout or CAPTCHA. Roughly how many attempts guarantee the correct code, and what single control is missing?
answer: rate limiting
accept: [rate limiting, a rate limit, rate-limiting, brute-force protection, lockout, no rate limit]
hint: A million tries is nothing to a script; something should have said stop.
```

## One request that costs the server everything

**Resource exhaustion** is asking for so much in one call that the server buckles: `GET /api/v1/export?limit=10000000`, a report with no cap, a deeply nested GraphQL query, an image resize at absurd dimensions. The OWASP name is *unrestricted resource consumption*. Test whether size and cost parameters have an upper bound.

```question
id: resource
prompt: Sending limit=10000000 to an export endpoint, or a report request with no cap, makes the server run out of memory and fall over. What class of API flaw is asking one call to consume unbounded resources?
answer: resource exhaustion
accept: [resource exhaustion, unrestricted resource consumption, denial of service, dos, unbounded resource consumption]
hint: The API set no ceiling on how much one request may cost.
```

## Check, then act, at the same instant

APIs make race conditions easy because there is no UI slowing you down — you fire the same request in parallel. A one-per-account limit, a single-use voucher, a withdrawal balance: send fifty at once and they all pass the check before any writes the result, exactly as in the Web Realm's scales.

```question
id: api-race
prompt: A voucher is single-use, but firing fifty redeem requests in the same instant redeems it fifty times because each reads "unused" before any marks it used. What is this?
answer: race condition
accept: [race condition, a race condition, toctou, concurrency bug]
hint: The requests race between the check and the act.
```

## Reading a whole dataset a page at a time

Even with a per-request cap, **pagination abuse** walks the entire dataset: `?page=1`, `?page=2`, … a script pulls every record the endpoint returns, turning a small BOLA or an over-broad list into a full database exfiltration. If `/api/v1/users?page=N` returns any user, all users leave a page at a time.

```question
id: pagination
prompt: An endpoint caps each response at 100 users, but you script through ?page=1, ?page=2 and so on to collect them all. What is walking every page to pull the whole dataset called?
answer: pagination abuse
accept: [pagination abuse, enumeration, scraping, pagination scraping, walking the pages, mass enumeration]
hint: The per-page cap does not stop you fetching every page.
```

> Machines are the API's expected caller, and it forgets to slow anyone down. No rate limit makes every secret guessable, no cost ceiling makes one request a denial of service, no concurrency control makes every limit a race, and no real cap makes pagination a full export. On an API, "unlimited" is a vulnerability.
