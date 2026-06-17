---
title: "Modify in-flight data to payment provider Smart2Pay"
slug: "modify-in-flight-data-to-payment-provider-smart2pay"
platform: "hackerone"
vuln_class: "Business Logic Errors"
difficulty: "hard"
scope_type: "web"
bounty: 7500
program: "Valve"
reporter: "drbrix"
published_at: "2021-08-10"
source_url: "https://hackerone.com/reports/1295844"
tags: []
teaser: "Intercepting and tampering live payment requests exposed how missing integrity checks let attackers redirect funds to arbitrary accounts."
---

## The Program

Valve Corporation operates Steam, one of the largest digital game distribution platforms in the world, serving hundreds of millions of users and processing enormous volumes of financial transactions daily. Steam Wallet — the platform's internal balance system — allows users to load funds and spend them on games, in-game items, and marketplace trades. Because Steam's marketplace enables peer-to-peer item trading with real monetary value, the integrity of wallet balances is critical not just to Valve but to the entire player-driven economy built on top of it.

Valve runs a bug bounty program through HackerOne, with rewards scaled to severity. Payment-related functionality sits at the top of any severity rubric: flaws that allow unauthorized balance generation threaten direct financial loss, platform trust, and market stability. The store.steampowered.com asset — specifically the fund-adding flow — is therefore one of the highest-value surfaces on the program.

What made this particular surface worth investigating was the use of a third-party payment provider, Smart2Pay, as an intermediary. Any time a platform delegates part of a financial flow to an external service, there is an implicit trust boundary between the two systems. That boundary — where data leaves Valve's servers and travels to Smart2Pay's API — was the exact attack surface that mattered here.

---

## The Recon

The investigation began at the standard Steam Wallet top-up flow: `https://store.steampowered.com/steamaccount/addfunds`. Navigating through the fund-addition process while running Burp Suite as an intercepting proxy revealed the sequence of HTTP requests involved in initiating a payment. Most of the early requests stayed within Steam's own domain, but selecting a payment method backed by Smart2Pay (such as Przelewy24, available in Poland) triggered a cross-origin POST request destined for `globalapi.smart2pay.com`.

Intercepting that outbound POST request exposed its full parameter structure:

```
MerchantID=1102&MerchantTransactionID=...&Amount=2000&Currency=PLN
&ReturnURL=...&MethodID=12&Country=PL
&CustomerEmail=...&CustomerName=...&SkipHPP=1
&Description=Steam+Purchase&SkinID=101&Hash=...
```

Several fields stood out immediately. The `Amount` field represented the transaction value in the smallest currency unit (2000 = 20.00 PLN). The `CustomerEmail` field was populated directly from the Steam account's registered email address — user-controlled data flowing into a payment request. Most importantly, the `Hash` field appeared at the end, serving as a message authentication code intended to prevent tampering.

The critical recon question became: how is the `Hash` computed? Documentation and behavioral testing pointed to a simple concatenation scheme — the hash was produced by joining all field names and their values into one long string and hashing it. For example: `hash("MerchantID" + "1102" + "MerchantTransactionID" + "..." + "Amount" + "2000" + ...)`. This design decision — concatenating without delimiters — opened the door to parameter boundary manipulation.

---

## The "Wait a Second..." Moment

The vulnerability crystallized around a single observation: the hash function treated the entire serialized string as one opaque blob, with no delimiters separating field names from values. That means the string `Amount=2000` contributes the substring `Amount2000` to the hash — but so does `Amount2=000`. Both produce identical hash inputs. The boundary between the field name and its value was invisible to the hash.

At the same moment, the `CustomerEmail` field was entirely user-controlled and flowed into the request verbatim. URL-encoded ampersands (`%26`) in an email value would be decoded by an intermediary parser into actual parameter separators — meaning a crafted email address like `brix&amount=100&ab=c@example.com` would, after URL decoding, inject a brand-new `amount` parameter into the request body. These two facts together — a delimiter-blind hash and a user-controlled field that could inject parameters — formed a complete exploit chain.

---

## The Exploit

**Step 1 — Prepare the Steam account email.**
Register or change the Steam account email to an address embedding the target amount and parameter names. The format follows the pattern `<prefix>amount<value><suffix>@<domain>`, for example: `brixamount100abc@example.com`. The `amount100` portion is what will later be injected as a standalone parameter.

**Step 2 — Initiate a real (low-value) fund addition.**
Navigate to `https://store.steampowered.com/steamaccount/addfunds` and begin a transaction for a small real amount (e.g., the minimum supported). Select the Smart2Pay-backed payment method. Proceed through the flow until the browser is about to POST to `globalapi.smart2pay.com`.

**Step 3 — Intercept the outbound POST.**
Using Burp Suite's proxy, intercept the POST request before it reaches Smart2Pay. The original body looks like:

```
MerchantID=1102&MerchantTransactionID=...&Amount=2000&Currency=PLN
&ReturnURL=...&MethodID=12&Country=PL
&CustomerEmail=brixamount100abc%40example.com
&CustomerName=_drbrix_&SkipHPP=1&Description=Steam+Purchase&SkinID=101&Hash=...
```

**Step 4 — Rename the original Amount field.**
Change `Amount=2000` to `Amount2=000`. The hash string remains valid because `Amount2000` appears in both serializations — the hash sees no difference.

**Step 5 — Inject the new amount via the email field.**
Decode the `CustomerEmail` value and replace it so that it introduces a new `amount` parameter:

```
CustomerEmail=brix&amount=100&ab=c%40example.com
```

After URL decoding by Smart2Pay's parser, this becomes three separate fields: `CustomerEmail=brix`, `amount=100`, and `ab=c@example.com`. The injected `amount=100` is what Smart2Pay processes as the transaction amount.

**Step 6 — Forward the modified request.**
The modified body becomes:

```
MerchantID=1102&MerchantTransactionID=...&Amount2=000&Currency=PLN
&ReturnURL=...&MethodID=12&Country=PL
&CustomerEmail=brix&amount=100&ab=c%40example.com
&CustomerName=_drbrix_&SkipHPP=1&Description=Steam+Purchase&SkinID=101&Hash=...
```

The Hash field remains unchanged and validates successfully because the concatenated string is identical. Smart2Pay processes the transaction at the injected `amount` value while Steam credits the wallet at whatever amount was originally agreed — a mismatch that generates balance out of thin air.

**Step 7 — Complete the payment.**
Pay the small real amount through the payment provider UI. Steam's backend, having seen a transaction completion signal referencing the original transaction ID, credits the wallet at the amount Steam had recorded — but the payment provider charges only the injected lower value (or the attacker's preferred amount).

---

## The Report

A strong report for this vulnerability begins with a title that immediately communicates both the mechanism and the impact: something like "HTTP Parameter Pollution in Smart2Pay integration allows arbitrary Steam Wallet balance generation." Triagers should understand the bug class and the business consequence before opening the body.

The severity justification should be explicit. This is Critical because it allows direct financial fraud at scale — an attacker can repeat the process indefinitely to generate unlimited wallet funds. The CVSS-adjacent reasoning covers high confidentiality impact (financial data integrity), high integrity impact (wallet balances corrupted), and high availability impact (market economy destabilized). Citing the business logic error weakness class (CWE-840 or similar) grounds the report in a recognized taxonomy.

Reproduction steps must be precise and numbered. They should specify: the exact email format to register, the URL to navigate to, which payment method to select, how to configure the proxy, exactly which parameters to rename and what the substitution looks like, and what successful exploitation looks like (wallet balance increases while real charge is lower). Including the raw before/after HTTP request bodies removes all ambiguity.

The impact statement should go beyond the immediate transaction. A well-written impact section would note: unlimited wallet generation undermines Valve's revenue, artificially generated balances can be laundered through the Steam Marketplace by purchasing items and reselling them, game key arbitrage becomes trivially profitable, and the integrity of the entire economy is at risk. Evidence of successful test transactions — even for small amounts — substantiates the claim and accelerates triage. This report was disclosed within one day, which reflects how clean and actionable the reproduction steps were.

---

## The Takeaway

The core insight is that hash-based integrity checks over concatenated strings without delimiters are vulnerable to parameter boundary ambiguity — and that user-controlled fields which flow into those strings can be weaponized to inject new parameters that bypass the signature entirely.

Similar bugs appear wherever a merchant integration passes user-controlled data (email, name, address fields) directly into a signed payment request. The pattern to look for: any field in a payment POST that originates from user profile data, combined with a hash that covers the entire serialized body. Tools that help surface this include Burp Suite's Intercept and Repeater tabs for inspecting and modifying outbound cross-origin requests, and browser developer tools for tracing the exact network calls made during a checkout flow.

Common variants of this class include: injecting newline characters to manipulate callback return values, manipulating `ReturnURL` parameters to redirect confirmation to attacker-controlled domains, and parameter order manipulation where the payment provider's parser gives precedence to the last occurrence of a duplicate key (the HTTP Parameter Pollution classic). Any time a payment flow crosses a trust boundary between two systems — especially when one system's signature scheme is documented or reverse-engineerable — the boundary itself is worth mapping with a proxy and probing with crafted inputs.
