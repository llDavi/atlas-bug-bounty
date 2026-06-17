---
title: "Ability to DOS any organization's SSO and open up the door to account takeovers"
slug: "ability-to-dos-any-organization-s-sso-and-open-up-the-door-t"
platform: "hackerone"
vuln_class: "Improper Authentication - Generic"
difficulty: "medium"
scope_type: "web"
bounty: 10500
program: "Superhuman (formerly Grammarly)"
reporter: "cache-money"
published_at: "2021-04-15"
source_url: "https://hackerone.com/reports/976603"
tags: []
teaser: "A misconfigured SSO endpoint allowed attackers to lock out entire organizations while creating a path for full account takeover."
---

## The Program

Grammarly (now operating under the Superhuman brand for its business products) is a widely-used AI-powered writing assistant that serves both individual consumers and enterprise teams. The business-tier product offered organizational features including team management, shared documents, and Single Sign-On (SSO) integration — the kind of infrastructure that large companies rely on to centrally manage employee access. Because enterprise features handle authentication for entire organizations rather than individual users, they represent a high-value attack surface: a single vulnerability can affect hundreds or thousands of accounts simultaneously.

The bug bounty program at Grammarly attracted researchers precisely because of this enterprise expansion. SSO integrations are notoriously complex to implement correctly — they involve cryptographic assertions, identity provider metadata, and string-matching logic that must all cooperate without ambiguity. When a company is rolling out SSO for the first time, edge cases in identifier handling tend to be under-tested.

What made this surface particularly worth investigating was the SAML-based SSO flow. SAML relies on an `entityId` — a string that uniquely identifies an Identity Provider — to route authentication responses to the correct organization. Any flaw in how that string is parsed, stored, or compared opens the door to cross-organization confusion. The question of "what happens when two entityIds look nearly identical?" is exactly the kind of boundary condition that security researchers probe.

---

## The Recon

The research began with Grammarly's business SSO setup flow, accessible through the administrative dashboard at `www.grammarly.com`. During the SAML configuration process, administrators are required to supply an Identity Provider Issuer value — the `entityId` — along with a signing certificate (keypair). This value is a string that the service stores and later uses to look up which organization a SAML response belongs to when a user attempts to log in.

Normal testing confirmed the expected behavior: configuring an `entityId` of, say, `https://idp.example.com/entity`, uploading the corresponding certificate, and then authenticating via that IdP successfully landed the user in the correct organization. Burp Suite would have been useful here for intercepting the SAML response in transit — capturing the `SAMLResponse` POST parameter sent back to Grammarly's Assertion Consumer Service (ACS) endpoint and inspecting the `<Issuer>` element inside the decoded XML.

The key recon insight came from probing how the backend handles the lookup: does it match the `entityId` from the SAML assertion exactly against the stored value, or does it normalize the string first? Many implementations call `trim()` or strip whitespace before comparison. The research question then became: what happens if the stored value in the database has trailing whitespace, but the SAML assertion contains the clean version? If the lookup logic applies `trim()` at one stage but not another, different code paths could resolve to different organizations.

To test this, a second Grammarly business account was created with an `entityId` set to the same value as the first, but with a single trailing space appended — `https://idp.example.com/entity `. Critically, this second account used a different signing keypair. The two-minute propagation window was observed, and then authentication against the first (legitimate) organization was attempted again. This is the kind of slow, methodical variant-testing that surfaces normalization bugs.

---

## The "Wait a Second..." Moment

After the second organization was configured with the space-appended `entityId` and propagation completed, attempting to log into the first organization produced an error. The login flow broke entirely — not for the attacker's account, but for the legitimate organization. That was the first signal that something had gone wrong in the lookup logic. The service was no longer able to route the authentication response to the correct organization. The DOS condition was live.

The deeper anomaly appeared when the victim user was removed from their original organization and the login was attempted again. This time, authentication succeeded — but the user was provisioned into the *attacker's* organization, despite the fact that the SAML response had been signed with the *victim organization's* private key. The signature check was passing (validating against the correct issuer after trimming), but the provisioning logic was then resolving the entity lookup without trimming, and finding the space-appended version first. Two different code paths, two different string-comparison behaviors, one catastrophic mismatch.

---

## The Exploit

The exploit requires control over two Grammarly business accounts and access to an identity provider capable of issuing SAML assertions. The target is any organization whose `entityId` is known or discoverable.

**Step 1 — Identify the target entityId.** The victim organization's Identity Provider Issuer string must be known. In many deployments this value is semi-public (embedded in IdP metadata URLs) or discoverable through social engineering, leaked configuration, or observation of SAML traffic.

**Step 2 — Create an attacker-controlled organization.** Register a second Grammarly business account. In the SSO configuration section, set the Identity Provider Issuer to the victim's `entityId` with a single trailing space appended. Upload a keypair that the attacker controls. This is the critical payload — the entityId value is: `<victim_entityId>[SPACE]`.

**Step 3 — Wait for propagation.** Allow approximately two minutes for the configuration to take effect in the backend. This is the window during which the new record is indexed in whatever data store the service uses for SSO lookups.

**Step 4 — Confirm the DOS.** Attempt to authenticate into the victim organization using the legitimate IdP and keypair. The service returns an error. The organization's SSO is now broken for all users — nobody in the victim organization can log in via SSO.

**Step 5 — Trigger cross-organization provisioning.** If a user is deleted from the victim organization (or if a new user who has never been provisioned attempts to SSO for the first time), the authentication flow resolves differently. The SAML assertion is validated against the trimmed `entityId` (matching the legitimate organization), but provisioning then queries for the entity without trimming, finds the space-appended record first, and places the user into the attacker's organization.

**Step 6 — Complete the account takeover.** Once the victim user is inside the attacker's organization, the attacker changes their own `entityId` to a fresh value. The attacker can then authenticate as the victim user using their own controlled keypair. If the victim account was converted from a personal Grammarly account, the attacker gains access to that user's personal documents.

The successful exploit produces a user session inside the attacker's organization authenticated as the victim, with no cryptographic material from the victim organization ever being compromised.

---

## The Report

A strong report for this class of vulnerability leads with a concrete, impact-first title. Something like *"Trailing whitespace in SSO entityId lookup enables organization-wide DOS and cross-organization account takeover"* communicates both the root cause and the severity in a single line. Triagers need to understand immediately whether this is theoretical or exploitable — the title should leave no ambiguity.

The severity justification requires framing around blast radius. This is not a self-XSS or a low-impact information disclosure — the DOS condition affects every user in an organization simultaneously, and the account takeover vector requires no compromise of cryptographic material. Mapping it to CVSS would highlight high confidentiality and integrity impact, broad scope (organization-wide), and low attack complexity once the target entityId is known. A $10,500 bounty reflects that framing.

Reproduction steps must be precise and self-contained. Each step should specify: which account (attacker vs. victim), what action was taken, what the exact configuration value was (including the space — this is easy for triagers to miss), and what the observable outcome was. The two-minute propagation delay is worth calling out explicitly; without it, a triager might test too quickly and conclude the bug doesn't reproduce. Screenshots of the error state and the unexpected provisioning event are essential evidence.

The impact statement should address two distinct scenarios separately: (1) the pure DOS case, which requires no victim interaction at all, and (2) the account takeover case, which requires the victim to either be a new SSO user or be removed and re-provisioned. Distinguishing these helps triagers assess the realistic exploitability of each path. Noting that new users attempting SSO for the first time are particularly at risk — since they would be expecting to land in an organization anyway — strengthens the social plausibility of the takeover path.

---

## The Takeaway

The core insight is that string normalization applied inconsistently across different code paths — trimming whitespace during signature validation but not during database lookups — is sufficient to decouple authentication from authorization entirely.

Similar bugs appear anywhere a system stores an identifier, validates it in one place, and resolves it in another. OAuth `client_id` handling, SAML `entityId` lookups, OIDC issuer matching, and API key namespacing are all candidates. The pattern to probe: take a known identifier, append or prepend whitespace, null bytes (`%00`), unicode lookalikes, or case variants, register it in a second account if the system permits, and observe whether the lookup behavior diverges from the validation behavior.

Burp Suite's Intruder or Repeater is useful for systematically fuzzing identifier fields with these variants. The `entityId` field specifically is worth testing in any SAML implementation because it passes through XML parsing, URL decoding, and database storage — each layer may normalize differently. Tools like `saml-raider` (a Burp extension) make it easier to intercept, decode, and modify SAML assertions in-flight without breaking the base64 encoding.

Common variants of this class of bug include: case-insensitive matching at validation but case-sensitive storage; URL-decoding applied at one layer but not another; Unicode normalization (NFC vs NFD) producing different byte sequences for visually identical strings; and null-byte injection causing string truncation in languages like C or older PHP versions. Any system that compares user-supplied strings against stored identifiers for authentication purposes is worth testing with these boundary inputs.
