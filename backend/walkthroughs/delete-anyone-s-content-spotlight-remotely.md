---
title: "Delete anyone's content spotlight remotely."
slug: "delete-anyone-s-content-spotlight-remotely"
platform: "hackerone"
vuln_class: "Insecure Direct Object Reference (IDOR)"
difficulty: "medium"
scope_type: "web"
bounty: 15000
program: "Snapchat"
reporter: "prickn9"
published_at: "2023-03-06"
source_url: "https://hackerone.com/reports/1819832"
tags: []
teaser: "A missing authorization check let any unauthenticated user delete another account's content spotlight via a simple remote API call."
---

## The Program

Snapchat is one of the world's largest social media platforms, known primarily for ephemeral messaging and multimedia sharing. With hundreds of millions of active users globally, the platform's attack surface is vast — spanning mobile apps, web interfaces, and a complex backend API infrastructure. Snapchat operates a bug bounty program through HackerOne, offering rewards commensurate with the severity and impact of reported vulnerabilities. A $15,000 bounty for this report reflects the seriousness with which the company treats unauthorized data manipulation affecting its user base.

Spotlight is Snapchat's short-form video feature, launched as a direct competitor to TikTok and Instagram Reels. At the time of this report, Spotlight was one of the platform's most strategically important products — Snapchat had invested heavily in monetizing creator content through the feature, paying creators directly based on video performance. Deleting a creator's Spotlight video would erase views, engagement, and potential earnings tied to that post.

The web interface at `my.snapchat.com/myposts` was a particularly interesting attack surface because it exposed content management operations — including deletion — through a GraphQL API. Web interfaces for mobile-first platforms are frequently less hardened than the primary app endpoints, and GraphQL mutations in particular tend to surface object reference patterns that are worth probing carefully.

---

## The Recon

The recon began at `my.snapchat.com/myposts`, the web-based content management dashboard for Snapchat accounts. This page lists a user's own posts, including Spotlight videos, and provides basic management actions such as deletion. Burp Suite was configured as an intercepting proxy to observe every network request made by the browser during normal content management activity.

With interception enabled, the delete action was triggered on one of the tester's own Spotlight posts. The outgoing request captured by Burp Suite revealed a GraphQL mutation endpoint. The mutation, named `DeleteStorySnaps`, accepted two variables: `ids` — an array of string identifiers — and `storyType`, set to `"SPOTLIGHT_STORY"`. The structure looked like this:

```json
{
  "operationName": "DeleteStorySnaps",
  "variables": {
    "ids": ["<redacted_id>"],
    "storyType": "SPOTLIGHT_STORY"
  },
  "query": "mutation DeleteStorySnaps($ids: [String!]!, $storyType: StoryType!) {\n  deleteStorySnaps(ids: $ids, storyType: $storyType)\n}\n"
}
```

The key observation was that the `ids` array contained a bare string identifier — no session binding, no ownership token, no signed payload. The server appeared to be trusting the client-supplied ID entirely. This pattern is a classic indicator of a potential IDOR vulnerability.

Obtaining a victim's Spotlight video ID required no special tooling. Snapchat's public sharing URLs for Spotlight content follow the format `https://story.snapchat.com/spotlight/<video_id>`. Any publicly shared Spotlight video exposes its identifier directly in the URL, meaning the `id` value needed to complete an attack is trivially discoverable by visiting any Spotlight post shared on social media, messaging apps, or embedded in web pages.

---

## The "Wait a Second..." Moment

The critical realization came when examining the `ids` parameter in the intercepted deletion request. The server was accepting a client-supplied identifier and performing the deletion operation — but no verification appeared to exist confirming that the authenticated user actually owned the resource corresponding to that ID. Ownership validation, if present, would typically be enforced server-side by cross-referencing the authenticated session's user account against the ownership record of the target object. That check was apparently absent.

What made the moment particularly striking was the combination of two factors: the ID was a simple, guessable (or observable) string, and the deletion was permanent. This was not a read-only data exposure — it was a destructive write operation. A missing authorization check on a destructive action, affecting content tied directly to creator earnings and platform monetization, elevated this from a theoretical curiosity to a high-severity vulnerability with immediate, tangible real-world impact.

---

## The Exploit

Exploitation required a Snapchat account, Burp Suite (or any HTTP interception proxy), and the ID of a target Spotlight video.

**Step 1 — Obtain the target video ID.** Navigate to any publicly shared Spotlight video. The ID is embedded directly in the sharing URL: `https://story.snapchat.com/spotlight/<VIDEO_ID>`. Copy this value.

**Step 2 — Set up interception.** Open Burp Suite and configure the browser to route traffic through the Burp proxy. Enable request interception in the Proxy tab.

**Step 3 — Trigger a legitimate deletion.** Log in to `my.snapchat.com/myposts` and initiate a delete action on one of the tester's own Spotlight posts. Burp Suite will intercept the outgoing GraphQL mutation request.

**Step 4 — Modify the request.** In the intercepted request body, locate the `ids` array within the `variables` object. Replace the tester's own video ID with the victim's video ID obtained in Step 1:

```json
{
  "operationName": "DeleteStorySnaps",
  "variables": {
    "ids": ["<VICTIM_VIDEO_ID>"],
    "storyType": "SPOTLIGHT_STORY"
  },
  "query": "mutation DeleteStorySnaps($ids: [String!]!, $storyType: StoryType!) {\n  deleteStorySnaps(ids: $ids, storyType: $storyType)\n}\n"
}
```

**Step 5 — Forward the request.** Forward the modified request through Burp Suite. A successful response from the server confirmed that the deletion was executed. The victim's Spotlight video would no longer be accessible on the platform.

Successful exploitation required no knowledge of the victim's credentials, no account compromise, and no interaction from the victim. The attack was entirely remote and silent.

---

## The Report

A well-structured report for this vulnerability would open with a clear, specific title such as: *"IDOR in DeleteStorySnaps GraphQL Mutation Allows Unauthenticated Deletion of Any User's Spotlight Video."* Vague titles like "delete bug" or "Spotlight issue" slow down triage; specificity tells the triager exactly what to look for before they even read the body.

Severity should be justified as High, citing the combination of: (1) no authentication of resource ownership, (2) destructive and irreversible impact (deletion cannot be undone), (3) trivial exploitability requiring only a publicly visible video URL, and (4) broad scope — any Spotlight video on the platform is a valid target. The CVSS vectors for Confidentiality, Integrity, and Availability should be referenced, with Integrity being the primary driver (permanent data destruction).

Reproduction steps should be numbered and explicit: include the exact GraphQL mutation body, specify that Burp Suite was used for interception, and identify exactly which field was modified. Screenshots or a screen recording of the deletion succeeding on a victim account (using a second test account as the victim) are essential. Triagers cannot reproduce without these artifacts.

The impact statement should go beyond the technical: frame the business consequence. Spotlight was tied to creator payouts; deleting a viral video could eliminate substantial earnings. Targeting influencers or high-profile accounts could cause reputational and financial harm. Emphasizing the platform's monetization dependency on Spotlight content makes the severity argument concrete and persuasive to a triage team weighing bounty amounts.

---

## The Takeaway

The core insight is this: **when a destructive server-side action accepts a client-supplied object identifier without verifying that the authenticated user owns the referenced object, any authenticated user can destroy any other user's data.**

Similar vulnerabilities appear wherever object IDs are passed directly in API requests — REST endpoints with `/resource/{id}` patterns, GraphQL mutations with ID variables, and form submissions containing hidden `id` fields are all candidates. The search methodology is consistent: intercept a legitimate action on an object the tester owns, identify the ID parameter, substitute an ID belonging to another user, and observe whether the server enforces ownership. Publicly exposed IDs — in share URLs, embed codes, API responses from public endpoints — are the raw material for crafting the substitution.

Burp Suite's Repeater and Intruder modules are the primary tools for this class of testing. Repeater allows precise manual substitution; Intruder can enumerate ranges of IDs if the format is sequential or predictable. GraphQL endpoints warrant special attention because mutations are often added rapidly during feature development and ownership checks are sometimes deferred or omitted entirely. Variants of this vulnerability appear in delete, update, transfer, and export operations across virtually every web platform that manages user-owned content.
