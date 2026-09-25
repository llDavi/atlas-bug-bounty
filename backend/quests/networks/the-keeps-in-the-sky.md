---
slug: "net-the-keeps-in-the-sky"
title: "The Keeps in the Sky"
kingdom: "networks"
place: "keeps-in-sky"
order: 1
xp: 240
difficulty: 2
minutes: 30
requires: []
skills: ["recon"]
attributes: { recon: 2, logic: 2 }
summary: "In the cloud there is no server room to break into — there is an account, and identity is the wall. Understand IAM and the shared responsibility line and cloud bugs stop being mysterious."
---

The cloud moved the keep into the sky: the target no longer owns the hardware, it owns an *account* on someone else's. That single shift relocates the whole security boundary from the network to **identity** — who is allowed to do what. Cloud hunting is mostly finding where that identity boundary was drawn too wide.

## The models, briefly

**IaaS** (raw servers you manage, like an EC2 instance), **PaaS** (a managed platform, like a database service), **SaaS** (finished software, like a hosted app). The higher you go, the more the provider secures and the less the customer touches — but the customer's *configuration* is theirs to get wrong at every level. That split is the **shared responsibility model**: the provider secures the cloud; the customer secures what they put in it.

```question
id: shared-responsibility
prompt: Under the shared responsibility model, the cloud provider secures the underlying platform. Who is responsible for configuring access, permissions and public/private settings correctly — and therefore where most cloud bugs live?
answer: the customer
accept: [the customer, the user, the account owner, the tenant, the client, the company using it]
hint: The provider secures the cloud; the customer secures what they run in it.
```

## Identity is the new perimeter

There is no server room to reach; there is an API, and every action against it is authorized by **IAM** — Identity and Access Management. A user, a role, or a service is granted permissions by policy. In the cloud, "can this identity perform this action on this resource?" replaces "is this host reachable?" as the central question. A misdrawn policy is the cloud's broken lock.

```question
id: iam
prompt: In the cloud there is no network to breach, only an API where every action is checked against a policy that says which identities may do what. What is this identity-and-permissions system generally called?
answer: IAM
accept: [iam, identity and access management, identity access management]
hint: Identity and Access Management.
```

## The permission drawn too wide

Policies grant actions on resources. The recurring bug is **excessive permissions** — a policy that grants far more than the task needs, most nakedly the wildcard that allows every action on every resource:

```json
{ "Effect": "Allow", "Action": "*", "Resource": "*" }
```

An identity holding that is administrator of the account. Even short of the wildcard, a role that can read every bucket, or attach any policy, is a privilege-escalation path waiting to be walked.

```question
id: excessive
prompt: An IAM policy grants Action "*" on Resource "*". What does that policy make the identity holding it, and what is this class of finding called?
answer: excessive permissions
accept: [excessive permissions, admin, an administrator, over-permissioned, over-privileged, too many permissions, full admin access, overly broad permissions]
hint: Every action on every resource is total control.
```

## The heart of the whole kingdom

So the cloud chapters that follow are variations on one theme: a resource left public, a credential left exposed, a role left too powerful — all failures of identity and configuration, not of the network. Keep the question in front of you: *which identity can do what, and where was that drawn wider than it needed to be?*

```question
id: theme
prompt: Across all the cloud attacks to come, what is the single boundary that, drawn too wide, causes most of them — the thing that replaced the network as the cloud's perimeter?
answer: identity
accept: [identity, iam, permissions, identity and permissions, the identity boundary, access permissions]
hint: In the sky, this is the wall, not the firewall.
```

> The keep is in the sky, so there is no wall to scale — only an account whose permissions are the wall. Learn that identity replaced the network, that the customer owns the misconfiguration, and that a policy drawn too wide is the broken lock, and every cloud bug ahead reads as a version of the same mistake.
