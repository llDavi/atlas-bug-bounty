---
slug: "net-the-great-spire"
title: "The Great Spire"
kingdom: "networks"
place: "the-great-spire"
order: 1
xp: 260
difficulty: 3
minutes: 35
requires: []
skills: ["recon"]
attributes: { recon: 2, exploitation: 2 }
summary: "AWS is the largest keep, and its services fail in known ways: S3 buckets set public, an EC2 role's keys through metadata, Cognito that lets anyone sign up, secrets sitting in Lambda's environment."
---

AWS runs more of the world than any other cloud, so its specific services are worth knowing by name — because each has a signature way of being left open. You do not memorise all of AWS; you learn the handful of services that hold data and identity, and the one misconfiguration each is famous for.

## S3, the bucket everyone forgets to close

**S3** is object storage, and public buckets are the single most reported cloud finding. Beyond fully public, watch for buckets readable by "any authenticated AWS user" (which is *everyone* with any AWS account, not just the target's), and for write-enabled buckets you can drop files into. Bucket names are global and guessable.

```question
id: s3-authenticated
prompt: An S3 bucket is not fully public but is readable by "Any Authenticated AWS User". Why is that almost as bad as public?
answer: any AWS account can read it
accept: [any aws user can read it, anyone with an aws account, any authenticated aws user is everyone, every aws account can read it, anyone with any aws account, all aws users]
hint: An "authenticated AWS user" is anyone who has signed up for AWS at all, not just the target.
```

## EC2, and the keys it carries

**EC2** is virtual servers, each often wearing an IAM role whose keys the metadata service will surrender to an SSRF — the chain from the last lesson. EC2 findings also include world-open security groups and secrets in **user-data**. An EC2 instance is a server plus a set of credentials waiting to be read.

```question
id: ec2
prompt: An EC2 instance runs with an IAM role. Combined with an SSRF or on-host access, which service hands out that role's temporary credentials?
answer: the metadata service
accept: [the metadata service, imds, the instance metadata service, metadata, 169.254.169.254, the metadata endpoint]
hint: The internal address at 169.254.169.254.
```

## The stores that hold identity and secrets

Two services are pure prizes when their permissions are loose: **Secrets Manager** (and SSM Parameter Store) hold API keys and database passwords — a role that can call `secretsmanager:GetSecretValue` on `*` reads them all. **Cognito** is AWS's user-auth service, and misconfigured pools allow open self-registration or let a user edit their own attributes (setting themselves an admin group).

```question
id: secrets-manager
prompt: A stolen role's policy allows secretsmanager:GetSecretValue on Resource "*". What can the attacker now read from the account?
answer: all the secrets
accept: [all secrets, every secret, all the secrets, all stored secrets, every stored secret, all the passwords and keys, all secret values]
hint: GetSecretValue on everything means every stored secret.
```

## Lambda and the rest

**Lambda** functions run code and keep configuration — including secrets — in **environment variables** readable to anyone who can view the function; a Lambda with an over-broad role is another set of keys. **API Gateway**, **ECS**/**EKS** (containers) and **CloudFront** each add surface, but the pattern holds: find the service, check who can reach it and what identity it carries.

```question
id: lambda
prompt: A Lambda function stores a database password in its environment variables, and a role you hold can view the function's configuration. What does that let you read?
answer: the secret in the environment variables
accept: [the environment variables, the secret, the database password, the env vars, the secrets in the environment, the environment variable secret, the password in env]
hint: Lambda config, including env vars, is readable to whoever can view the function.
```

> AWS is many keeps, each open a known way: S3 public or "authenticated-user" readable, EC2 surrendering its role through metadata, Secrets Manager and Cognito loose on permissions, Lambda leaking secrets from its environment. Learn the service names not to memorise the cloud, but to know exactly which latch each one leaves unturned.
