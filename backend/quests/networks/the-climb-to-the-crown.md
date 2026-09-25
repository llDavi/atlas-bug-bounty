---
slug: "net-the-climb-to-the-crown"
title: "The Climb to the Crown"
kingdom: "networks"
place: "climb-to-crown"
order: 1
xp: 300
difficulty: 4
minutes: 40
requires: []
skills: ["logic"]
attributes: { exploitation: 3, logic: 3 }
summary: "No single cloud bug is the breach; the chain is. A public bucket leaks a key, the key's identity can enumerate its own permissions, and one over-broad permission is the ladder from foothold to account owner."
---

Cloud compromise is rarely one bug — it is a *climb*. Each rung is a small misconfiguration, and the art is linking them: public storage hands you a credential, the credential enumerates its own rights, and a single over-broad permission lets a low-privilege identity make itself administrator. The final chapter of the spires is stitching the doors-on-the-latch into a ladder to the crown.

## Foothold: a key from an open door

The climb starts with any credential — from a public bucket holding an `.env`, an SSRF reading instance metadata, a key in a repo. However you get it, you now hold *an* identity in the account, however lowly.

```question
id: foothold
prompt: A public S3 bucket contains a backup with an .env file holding AWS keys. In the climb, what is that first credential — however low-privilege — called?
answer: a foothold
accept: [a foothold, the foothold, initial access, the initial credential, an initial foothold, the first credential, entry access]
hint: The first rung is any identity in the account.
```

## Enumerate what you are

Before doing anything loud, you learn your own identity and permissions: `aws sts get-caller-identity`, then enumerate attached policies and what actions they allow. Tools like `enumerate-iam`, ScoutSuite or Pacu map the account and, crucially, flag any permission that is a known **privilege-escalation primitive**.

```question
id: enumerate
prompt: With a low-privilege key in hand, what do you do before anything else — determine which specific actions the identity is actually allowed to perform?
answer: enumerate its permissions
accept: [enumerate its permissions, enumerate the permissions, list the policies, check what it can do, enumerate iam, map its permissions, find out what it can do]
hint: Learn exactly what this identity may touch.
```

## The rung that reaches the top

A handful of IAM permissions let a weak identity become a strong one. The famous ones: `iam:CreatePolicyVersion` (rewrite a policy you are attached to, granting yourself `*:*`), `iam:AttachUserPolicy` (attach the AdministratorAccess policy to yourself), and `iam:PassRole` combined with a service (launch a Lambda or EC2 *as* a powerful role and act through it). One of these is the ladder from foothold to admin.

```question
id: passrole
prompt: Your low-privilege identity has iam:PassRole plus permission to create a Lambda. You pass a powerful admin role to a function you create, and it runs with that role's rights. What class of attack is turning a small permission into a powerful identity this way?
answer: privilege escalation
accept: [privilege escalation, priv esc, privesc, iam privilege escalation, escalation, privilege-escalation]
hint: You escalate from a weak identity to a strong one.
```

## The crown: account takeover

Once you hold an administrator identity, the account is yours — every bucket, every secret, every instance, every other identity. That is **cloud account takeover**, and it is almost always the end of a chain of small, individually-minor misconfigurations, not one dramatic exploit.

```question
id: takeover
prompt: The climb ends when a chain of small misconfigurations has made you an administrator of the whole cloud account. What is that outcome called?
answer: account takeover
accept: [account takeover, cloud account takeover, full account takeover, full compromise, total account compromise, cloud takeover]
hint: You now own the entire account.
```

## Why the chain matters more than the bug

Reported alone, "a bucket is public" or "this role has PassRole" is low or medium. Chained — public bucket to key to enumeration to PassRole to admin — it is a critical account takeover. The cloud hunter's real skill is seeing the ladder in a pile of small findings, and demonstrating the whole climb in the report.

```question
id: chain
prompt: Individually, a public bucket and an over-broad PassRole permission are minor. What makes them a critical finding worth the top payout?
answer: chaining them
accept: [chaining them, chaining them together, the chain, combining them, chaining them into account takeover, linking them, the chain to takeover]
hint: The rungs are small; the ladder is critical.
```

> No single latch is the breach; the climb is. A key from a public door, the enumeration that reads your own rights, the one permission that rewrites them, and the crown falls. See the ladder in the scattered misconfigurations, walk it end to end, and report the whole climb — because in the cloud, the chain is the vulnerability.
