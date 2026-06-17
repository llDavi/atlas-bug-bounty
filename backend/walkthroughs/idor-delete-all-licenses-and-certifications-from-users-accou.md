---
title: "IDOR - Delete all Licenses and certifications from users account using CreateOrUpdateHackerCertification GraphQL query"
slug: "idor-delete-all-licenses-and-certifications-from-users-accou"
platform: "hackerone"
vuln_class: "Insecure Direct Object Reference (IDOR)"
difficulty: "medium"
scope_type: "web"
bounty: 12500
program: "HackerOne"
reporter: "harshdranjan"
published_at: "2023-08-29"
source_url: "https://hackerone.com/reports/2122671"
tags: []
teaser: "A missing ownership check on a mutation meant you could silently erase anyone's credentials by simply swapping their user ID."
---

## The Program

HackerOne is the world's largest bug bounty and vulnerability coordination platform, connecting security researchers with organizations seeking to improve their security posture. As a platform that handles sensitive security disclosures and researcher reputations, HackerOne operates its own public bug bounty program — a notable choice that demonstrates organizational commitment to security and creates a compelling target for researchers who want to test their skills against a sophisticated, security-aware team.

The platform hosts rich profile features for security researchers, including the ability to list professional Licenses and Certifications — credentials like OSCP, CEH, or industry-specific certifications that researchers display to build credibility. This functionality involves creating, reading, updating, and deleting (CRUD) user-owned objects, which is precisely the kind of surface area where authorization logic mistakes tend to appear. Any feature that modifies user-owned records must enforce ownership checks on every operation, not just at the UI layer.

What made this attack surface particularly notable is the combination of two factors: HackerOne uses GraphQL for its API (a technology where authorization is often implemented inconsistently across mutations), and the certification editing flow required passing an object ID explicitly in the request body. Explicit numeric IDs passed client-side are a classic IDOR setup — the server must independently verify that the authenticated user owns the object referenced by that ID, and if it does not, any authenticated user can reference any object in the system.

---

## The Recon

Recon for this class of vulnerability begins with mapping authenticated user flows that involve owned objects. The certification management feature on HackerOne is accessible via the profile editing section of the platform. Navigating to the Licenses and Certifications panel and performing any edit action — modifying a field, saving a record — generates an outbound API call that can be observed with an intercepting proxy.

Burp Suite is the standard tool for this step. With the browser configured to route traffic through Burp's proxy (typically listening on `127.0.0.1:8080`), every HTTP request made during the editing flow appears in the Proxy intercept tab or HTTP history. When the save action is triggered, the outbound request reveals itself as a GraphQL mutation — specifically `CreateOrUpdateHackerCertification`. The request body contains a JSON payload including an `id` field corresponding to the specific certification record being modified.

GraphQL mutations are worth examining closely during recon because they consolidate multiple operations (create and update, in this case) into a single endpoint. This design pattern can lead developers to implement authorization checks that focus on whether the user is authenticated, rather than whether the authenticated user has ownership of the specific object ID referenced in the mutation payload. The mutation name itself — `CreateOrUpdateHackerCertification` — hints that the same endpoint handles both creation (where no existing ID is needed) and updates (where an ID is required), a complexity that can mask authorization gaps.

Two test accounts — User A and User B — are created in separate browsers to establish a controlled environment. User B's certification is created to generate a known, valid object ID belonging to a different user. This ID becomes the pivot point for the authorization test.

---

## The "Wait a Second..." Moment

After intercepting the `CreateOrUpdateHackerCertification` mutation from User A's session and observing the `id` field in the request body, the test is straightforward: replace User A's certification ID with the ID belonging to User B's certification. The mutation is forwarded. The server processes it without returning an authorization error.

What made this moment significant is what the response — and subsequent verification — revealed: User B's certification record had been deleted or overwritten, despite the request originating from User A's authenticated session. The server accepted the foreign object ID without performing any ownership check. Because the ID space is sequential numeric integers with a predictable range, this is not a targeted attack against one known user — it is a mechanism for deleting every certification record on the platform by iterating IDs from 1 to N. The blast radius transforms a profile-tampering bug into a platform-wide data destruction vulnerability.

---

## The Exploit

Exploitation follows a direct sequence that any beginner can reproduce in a controlled, two-account test environment:

**Step 1 — Setup.** Create two separate HackerOne accounts (User A and User B). Log into each in a different browser or browser profile. Add at least one License or Certification to each account.

**Step 2 — Identify User B's certification ID.** While logged in as User B, navigate to the Licenses and Certifications section and trigger an edit action. Capture the outbound GraphQL request in Burp Suite. Locate the `id` field in the mutation payload — this is the target ID. Note it down.

**Step 3 — Intercept User A's mutation.** Switch to the browser logged in as User A. Edit User A's own certification and intercept the resulting `CreateOrUpdateHackerCertification` GraphQL mutation in Burp Suite before forwarding it.

**Step 4 — Substitute the ID.** In Burp's Intercept tab, locate the `id` field in the JSON request body. Replace User A's certification ID with User B's certification ID captured in Step 2. The modified request body looks structurally like:

```json
{
  "operationName": "CreateOrUpdateHackerCertification",
  "variables": {
    "id": <User_B_cert_ID>,
    ...
  }
}
```

**Step 5 — Forward the request.** Allow Burp to forward the modified request. The server processes the mutation using User A's session token but acting on User B's object ID.

**Step 6 — Verify impact.** Log into User B's account and navigate to Licenses and Certifications. User B's certification has been deleted. No error was returned to User A, and no ownership validation occurred server-side.

Successful exploitation at scale would involve iterating the `id` value across the full numeric range — a simple scripted loop — to wipe all certification records platform-wide.

---

## The Report

A strong report for this vulnerability leads with a precise, descriptive title that names the affected endpoint and the impact: "IDOR via `CreateOrUpdateHackerCertification` GraphQL Mutation Allows Deletion of Any User's Certifications." Vague titles like "IDOR on profile page" fail to communicate scope and slow triage.

Severity justification should reference both the CVSS score and a plain-language explanation of why it qualifies. This bug scores High (CVSS 7.5) because it is remotely exploitable by any authenticated user, requires no special privileges beyond a free account, and the impact is deletion of data at platform-wide scale — no confidentiality breach needed when integrity and availability are fully compromised. The report should explicitly state that sequential IDs make mass exploitation trivially scriptable.

Reproduction steps must be atomic and reproducible. Each step should reference exactly what to click, what to intercept, and what to modify. The report should specify the exact GraphQL mutation name (`CreateOrUpdateHackerCertification`), the parameter name (`id`), and the value substituted. A short proof-of-concept video showing User B's certification disappearing after User A's modified request is forwarded is highly persuasive and dramatically accelerates triage.

The impact statement should be written in terms of what an adversary with malicious intent could accomplish at scale: iterating all certification IDs to destroy researcher credibility signals across the platform. Triagers accept reports quickly when they do not need to imagine the worst case — it should be spelled out explicitly and supported by the PoC.

---

## The Takeaway

The core insight is this: **any mutation that accepts a user-supplied object ID must re-verify server-side that the authenticated user owns that object — every time, without exception.** 

Similar bugs appear anywhere editable user-owned records pass their ID back to the server: profile fields, comments, attachments, addresses, payment methods, support tickets, and API keys. GraphQL APIs are particularly fertile ground because authorization logic is often implemented per-resolver without a consistent middleware layer enforcing ownership, making it easy for a single mutation to be overlooked during security review. REST APIs suffer from the same pattern when PUT or DELETE endpoints accept a resource ID in the request body or URL path without re-checking ownership.

Tools that accelerate discovery of this pattern include Burp Suite's HTTP history (for spotting ID parameters in requests), Autorize (a Burp extension that automatically replays requests from a low-privilege session to detect missing authorization), and browser DevTools for inspecting GraphQL payloads directly in the Network tab. The reconnaissance habit to build is simple: whenever an editing flow is observed, locate every ID field in the outbound request and ask whether the server would reject a foreign ID from the same authenticated session. If the answer requires testing to determine — test it.
