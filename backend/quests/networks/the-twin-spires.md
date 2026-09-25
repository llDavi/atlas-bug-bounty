---
slug: "net-the-twin-spires"
title: "The Twin Spires"
kingdom: "networks"
place: "twin-spires"
order: 1
xp: 250
difficulty: 3
minutes: 30
requires: []
skills: ["recon"]
attributes: { recon: 2, logic: 2 }
summary: "Azure and Google Cloud are the other two keeps — different names, the same latches. A public blob, an over-powered service account, a metadata service that answers with a special header."
---

Most targets are not only on AWS. **Azure** and **Google Cloud** hold the same kinds of data behind the same kinds of mistake, under different names. Learn the translation and your AWS instincts carry straight across: storage that can be public, identities that can be over-permissioned, a metadata service that leaks credentials.

## Azure: storage, Entra, and functions

Azure keeps files in **Blob Storage** containers, which — like S3 — can be set public and enumerated. Identity is **Entra ID** (formerly Azure AD); its tokens and app registrations are the equivalent of IAM. **Azure Functions** are the Lambda equivalent, with the same secrets-in-config risk. And Azure has its own metadata service on the same `169.254.169.254`, requiring a specific header.

```question
id: blob
prompt: Azure's equivalent of a public S3 bucket is a publicly readable container in which storage service?
answer: Blob Storage
accept: [blob storage, azure blob storage, blob, azure blob, blobs]
hint: Azure keeps objects in "blobs".
```

## GCP: buckets and the service account

Google Cloud stores objects in **GCS** buckets (again, public-able). Its identity model leans on **service accounts** — non-human identities attached to resources, exactly like AWS instance roles, and just as dangerous when over-privileged. A GCP VM's metadata service hands out the service account's token to anything on the box (or an SSRF), but it requires a header to answer:

```
curl -H "Metadata-Flavor: Google" \
  http://169.254.169.254/computeMetadata/v1/instance/service-accounts/default/token
```

That `Metadata-Flavor: Google` header is required — an SSRF must be able to send it — and the response is an OAuth token for the service account.

```question
id: gcp-metadata
prompt: To read a GCP VM's service-account token from its metadata service, the request must carry a specific header. What is notable about that header for exploiting it via SSRF — the request must be able to set which header?
answer: Metadata-Flavor Google
accept: [metadata-flavor google, the metadata-flavor header, metadata-flavor, the metadata flavor google header, a metadata-flavor header, metadataflavor google]
hint: GCP demands a Metadata-Flavor header set to Google.
```

## The same identity trap, renamed

The heart is identical everywhere: a non-human identity (AWS instance role, Azure managed identity, GCP service account) attached to a resource, granted more than it needs. Compromise the resource, read its token from metadata, and inherit its permissions. The cloud does not matter; the over-permissioned machine identity does.

```question
id: service-account
prompt: GCP's service accounts, Azure's managed identities, and AWS's instance roles are the same concept under three names. What are they — the non-human identities you steal from a compromised resource's metadata?
answer: machine identities
accept: [machine identities, non-human identities, service identities, workload identities, machine/service identities, non-human/machine identities, service accounts]
hint: Identities for machines, not people, attached to resources.
```

## Translate and move on

So a hunter reads any cloud the same way: find the storage and check if it is public, find the compute and check what identity it carries, find the metadata path and see if an SSRF can reach it. Only the service names and one header change between the three spires.

```question
id: translate
prompt: Moving from an AWS target to an Azure or GCP one, how much of your method changes — the whole approach, or mostly just the service names and details?
answer: mostly just the names
accept: [just the names, mostly the names, the service names, only the names and details, little changes, mostly names and details, just the terminology]
hint: Storage, identity, and metadata exist on all three; the labels differ.
```

> The twin spires hold the same treasure behind the same latches: a public blob or GCS bucket, an over-powered managed identity or service account, a metadata service one header away. Learn the translations once and every cloud becomes the cloud you already know how to read.
