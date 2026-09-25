---
slug: "net-the-keeps-own-voice"
title: "The Keep's Own Voice"
kingdom: "networks"
place: "doors-on-latch"
order: 2
xp: 290
difficulty: 4
minutes: 35
requires: []
skills: ["ssrf"]
attributes: { exploitation: 3, logic: 2 }
summary: "Every cloud server has an internal oracle that will hand out its own identity's keys to anything on the box — which is why an SSRF in the cloud is not a data leak, it is the account."
---

Every cloud instance carries a secret voice: an internal **metadata service** that answers only from the machine and hands out configuration — including the temporary credentials of the role the instance runs as. This is why an SSRF against a cloud host is the crown jewel of the Web Realm: it is not a data leak, it is a login to the account.

## The address that answers only from inside

At `169.254.169.254` (the same on AWS, Azure and GCP) sits the metadata service. Reached from *on* the instance — directly, or through an **SSRF** that makes the server fetch it — it returns the instance's role and its live credentials:

```
http://169.254.169.254/latest/meta-data/iam/security-credentials/app-role
{ "AccessKeyId": "ASIA...", "SecretAccessKey": "...", "Token": "..." }
```

Those `ASIA...` keys are the **instance role's** temporary credentials. An SSRF that reaches this endpoint turns a web bug into cloud account access — the single highest-impact chain in the field.

```question
id: metadata
prompt: An SSRF makes a cloud server fetch http://169.254.169.254/latest/meta-data/iam/security-credentials/. What does that internal endpoint return that turns the SSRF into account compromise?
answer: the instance role credentials
accept: [the instance role credentials, iam credentials, the instance's credentials, temporary credentials, the role's keys, the instance role's keys, aws credentials]
hint: The metadata service hands out the role the instance runs as.
```

## The role the instance wears

An instance is assigned an **IAM role** so its software can call cloud APIs without a hardcoded key. Convenient — and it means the metadata credentials can do whatever that role can. If the role is over-permissioned (read every bucket, launch instances, read secrets), the SSRF inherits all of it. The role's power is the blast radius of the metadata leak.

```question
id: instance-role
prompt: The credentials the metadata service hands out belong to the instance's assigned IAM role. What determines how much damage an attacker who steals them can do?
answer: the role's permissions
accept: [the role's permissions, what the role can do, the role's policy, how much the role is allowed, the permissions of the role, the role's privileges, the scope of the role]
hint: The keys can do exactly what the role can — no more, no less.
```

## The version that closes the door

AWS's fix is **IMDSv2**, which requires a session token (a `PUT` first) before the metadata answers — a step a simple SSRF cannot make. A host still on **IMDSv1** answers a plain `GET`, so it is directly SSRF-exploitable. Checking whether the metadata service requires a token is a real finding in itself.

```question
id: imdsv2
prompt: AWS IMDSv2 requires the caller to first obtain a session token with a PUT request before the metadata service will answer, which a basic SSRF cannot do. A host still using which version answers a plain GET and stays SSRF-exploitable?
answer: IMDSv1
accept: [imdsv1, imds v1, version 1, imdsv1 version 1, the v1, imds version 1]
hint: The older version, before the token requirement.
```

## What you do with the keys

Holding the role's credentials, you move from the web to the cloud API: `aws sts get-caller-identity` to see who you are, then enumerate what the role may touch — buckets, secrets, other roles. The SSRF was the door; the IAM permissions decide how far into the account you walk, which is the next lesson's climb.

```question
id: pivot
prompt: You now hold the instance role's credentials from the metadata service. What is the first command to run to confirm the keys work and learn which identity you have become?
answer: aws sts get-caller-identity
accept: [aws sts get-caller-identity, sts get-caller-identity, get-caller-identity, sts getcalleridentity, aws sts get caller identity]
hint: It reports who the current credentials belong to.
```

> The keep speaks to whoever stands on it, and it speaks its own keys. That is why an SSRF in the cloud is not a leak but a login: it reaches the metadata service and walks off with the instance role's credentials. Check for IMDSv1, take the keys, and the role's permissions become the size of your reach.
