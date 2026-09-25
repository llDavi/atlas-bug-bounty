---
slug: "net-doors-left-on-the-latch"
title: "Doors Left on the Latch"
kingdom: "networks"
place: "doors-on-latch"
order: 1
xp: 260
difficulty: 3
minutes: 35
requires: []
skills: ["recon"]
attributes: { recon: 2, exploitation: 2 }
summary: "The commonest cloud bugs need no exploit: a storage bucket left public, a credential committed to a repo, a database port opened to the whole internet. You find them by looking, not attacking."
---

Most cloud findings are not clever — they are doors left on the latch. A storage bucket set to public, a key committed to GitHub, a security group opened to the world: each is a misconfiguration you *discover*, not exploit. The whole skill is knowing where the latches are and checking each one.

## The bucket anyone can open

Object storage — S3 on AWS, Blob on Azure, GCS on Google — holds the target's files, and is meant to be private. Left public, its contents are downloadable by anyone who knows (or guesses) the name:

```
aws s3 ls s3://acme-backups --no-sign-request
2024-01-02  database-dump.sql
2024-01-02  users-export.csv
```

`--no-sign-request` means *no credentials* — you are an anonymous stranger, and the bucket answered. Public buckets leak backups, PII, source code, and often more credentials. Bucket names are guessable (`company-backups`, `company-dev`) and enumerable.

```question
id: public-bucket
prompt: You list a storage bucket's contents with --no-sign-request, meaning you sent no credentials at all, and it returns a database dump. What misconfiguration is that?
answer: a public bucket
accept: [a public bucket, public storage, public s3 bucket, a publicly accessible bucket, open bucket, misconfigured public storage, publicly readable bucket]
hint: It answered an anonymous request.
```

## The credential left in the open

Cloud keys leak constantly — committed to public GitHub, baked into a mobile app, printed in a verbose error, sitting in an exposed `.env` or `.git/config`. An AWS key pair (`AKIA...` plus its secret) found anywhere is a login to the account. The find is often in code the target published without noticing.

```question
id: exposed-cred
prompt: In a target's public GitHub repo you find an AKIA... string and a matching secret committed months ago. What is that, and why is it critical?
answer: exposed AWS credentials
accept: [exposed credentials, aws credentials, an aws key, leaked credentials, exposed aws keys, an aws access key, hardcoded credentials]
hint: An AKIA key and its secret are a working login to the account.
```

Once you hold a key, `aws sts get-caller-identity` tells you *whose* it is and confirms it works — the first command against any credential you find.

## The port opened to the world

Cloud firewalls are **security groups**, and the classic slip is a rule allowing a sensitive port from `0.0.0.0/0`: a database (3306, 5432, 27017), a cache (6379), an admin panel, a Kubernetes API. Combined with your port survey, an internet-open database with weak or no auth is a direct breach.

```question
id: security-group
prompt: A security group exposes port 27017 (MongoDB) to 0.0.0.0/0, and the database has no authentication. What single change to the source range would have prevented this exposure?
answer: restrict the source
accept: [restrict the source range, limit the source, not open it to the world, restrict to specific ips, narrow the source, close it to the internet, restrict 0.0.0.0/0]
hint: The bug is the source being everyone; the fix is making it someone.
```

## Secrets that were not managed

Cloud providers offer proper secret stores (Secrets Manager, Key Vault, Secret Manager), but teams still hardcode secrets into environment variables, container images, user-data scripts, and templates. An EC2 instance's **user-data** script, readable by anyone who can reach it, frequently contains a database password in plain text.

```question
id: secrets
prompt: A database password sits in plain text in an EC2 instance's user-data script instead of a managed secret store. What class of finding is sensitive secrets kept in the wrong, exposed place?
answer: exposed secrets
accept: [exposed secrets, hardcoded secrets, poor secrets management, insecure secrets management, secrets in plaintext, exposed credentials, bad secrets management]
hint: The provider offered a vault for it; the team left it in a script.
```

> The latches are everywhere and mostly unturned: a public bucket, a committed key, a database open to the internet, a password in a startup script. None needs an exploit — only that you check each door. In the cloud, the biggest breaches are usually the simplest oversights, found by whoever looked.
