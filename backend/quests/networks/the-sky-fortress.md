---
slug: "net-the-sky-fortress"
title: "The Sky Fortress"
kingdom: "networks"
place: "sky-fortress"
order: 1
xp: 500
difficulty: 5
minutes: 50
requires: []
skills: ["recon", "ssrf", "logic"]
attributes: { recon: 2, exploitation: 3, logic: 3 }
summary: "A cloud environment, black-box, and one host to start from. Survey it, take an identity from the sky, and climb the chain to the crown. The final trial of the Cloud Spires."
---

You are given a single scope — `*.acme.cloud` — and told only that the target runs in the cloud. This is the assessment as it arrives: a fortress in the sky, and the whole kingdom to climb it. Survey the ground, take a credential from the machine's own voice, enumerate what you have become, and walk the chain to the crown.

## Survey the ground

You enumerate the scope and scan the live hosts, finding a web app on `app.acme.cloud` and, among its features, an image-import tool that fetches a URL you provide.

```question
id: ssrf
prompt: The image-import feature fetches any URL you supply, so you point it at http://169.254.169.254/latest/meta-data/. What vulnerability lets you make the server fetch that internal address?
answer: SSRF
accept: [ssrf, server-side request forgery, server side request forgery]
hint: You forge a request the server makes for you.
```

## Take the keep's keys

The metadata service answers because the host is on the older, tokenless version, and it hands back the instance role's credentials.

```question
id: imds
prompt: The metadata service returns the role's keys because the host answers a plain GET with no token step. Which metadata version, lacking that token requirement, made the SSRF succeed?
answer: IMDSv1
accept: [imdsv1, imds v1, version 1, the v1, imds version 1]
hint: The older version, before IMDSv2's token.
```

## Learn what you have become

Holding the credentials, you confirm the identity and enumerate its rights.

```question
id: identity
prompt: With the stolen keys, which command confirms they work and tells you which identity you now hold in the account?
answer: aws sts get-caller-identity
accept: [aws sts get-caller-identity, sts get-caller-identity, get-caller-identity, aws sts get caller identity]
hint: It reports who the current credentials belong to.
```

The role can read every S3 bucket, and one bucket holds a Terraform state file with a second, more powerful set of keys — and that identity has `iam:AttachUserPolicy`.

```question
id: enumerate
prompt: Before acting, you list exactly which actions your stolen identity is allowed to perform, looking for a privilege-escalation primitive. What is this step called?
answer: enumerating permissions
accept: [enumerating permissions, enumerate its permissions, enumerating iam, mapping permissions, listing the permissions, enumerate the permissions, iam enumeration]
hint: Learn what the identity may do.
```

## Climb to the crown

The second identity's `iam:AttachUserPolicy` lets you attach the AdministratorAccess policy to yourself.

```question
id: privesc
prompt: Using iam:AttachUserPolicy you attach AdministratorAccess to your own user, becoming admin of the account. What class of attack is turning a limited permission into full control this way?
answer: privilege escalation
accept: [privilege escalation, privesc, priv esc, iam privilege escalation, escalation]
hint: You escalate to a far stronger identity.
```

```question
id: takeover
prompt: You are now administrator of the entire cloud account. What is this final outcome — reached by chaining SSRF, a public state file, and an IAM misconfiguration — called?
answer: account takeover
accept: [account takeover, cloud account takeover, full account takeover, cloud takeover, full compromise]
hint: You own the whole account.
```

## Report the climb

You demonstrate the whole ladder and lead with its impact.

```question
id: report
prompt: Your report chains SSRF to metadata credentials to a public state file to an IAM escalation to full admin. Reported as one chain rather than four small issues, what severity does the demonstrated account takeover warrant?
answer: critical
accept: [critical, critical severity, the highest, highest severity, a critical, top severity]
hint: A demonstrated full account takeover is the top of the scale.
```

> One scope and a single fetching feature, walked to the crown: SSRF to the metadata keys, enumeration to find the ladder, a public state file for a stronger identity, an IAM escalation to administrator — the whole climb, reported as the critical chain it is. The Cloud Spires are behind you, and with them the last kingdom of the realm.
