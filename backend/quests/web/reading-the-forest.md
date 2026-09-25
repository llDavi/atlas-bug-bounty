---
slug: "reading-the-forest"
title: "Reading the Forest from Outside"
kingdom: "web"
place: "forest-of-recon"
order: 1
xp: 240
difficulty: 2
minutes: 35
requires: []
skills: ["recon"]
attributes: { recon: 3, patience: 1 }
summary: "Before you touch the target, the internet has already mapped it for you — certificate logs, DNS, and public records hand you subdomains nobody linked."
---

The forest is not hidden, only unlit. Most of a target's attack surface is written down in public records that were never meant to be read together: certificate logs, DNS, search-engine caches, code repositories. **Passive recon** reads all of that *without sending a single packet to the target* — and it routinely finds the forgotten `dev-`, `staging-` and `internal-` hosts where the real bugs live.

## Passive means you never knock

The line worth keeping straight: **passive** recon touches only third parties (public logs, DNS resolvers, archives); **active** recon sends requests to the target itself. Passive is silent and safe to run wide; active is where you start being a visitor the target can log.

```question
id: passive-active
prompt: One kind of recon reads only public third-party records and never sends a packet to the target; the other probes the target's own servers directly. Which of the two actually sends requests to the target — passive, or active?
answer: active
accept: [active recon]
hint: Passive stays off the target entirely.
```

## Certificate transparency: the subdomain firehose

Every time a company gets a TLS certificate, it is logged in public **Certificate Transparency** logs. Query them for a domain and you get a list of hostnames it has certificates for — including ones on no sitemap. `crt.sh` is the usual door:

```
https://crt.sh/?q=%25.target.com&output=json
```

A single query on a real target hands back things like:

```
api.target.com
staging.target.com
vpn.target.com
jenkins.internal.target.com
grafana-dev.target.com
```

`jenkins.internal.target.com` and `grafana-dev.target.com` were never linked from anywhere — the certificate log leaked them. Those are exactly the under-guarded boxes a hunter wants.

```question
id: ct-logs
prompt: Querying crt.sh for a domain returns hostnames like jenkins.internal.target.com that appear on no sitemap. Which public source just handed you those subdomains?
answer: certificate transparency
accept: [certificate transparency logs, ct logs, crt.sh, cert transparency]
hint: Every issued TLS certificate is logged publicly.
```

## Subdomain enumeration, at scale

CT logs are one feed; tools like `subfinder` and `amass` pull dozens (DNS aggregators, search engines, passive datasets) and merge them:

```
subfinder -d target.com -all -silent | tee subs.txt
# 412 subdomains
```

More subdomains means more surface. Each one might run a different app, a different framework, a forgotten admin panel — and the guild's whole method starts with *having the list nobody else bothered to build*.

```question
id: subdomains
prompt: Two hunters test the same program. One first builds a list of 412 subdomains with subfinder and amass; the other tests only www. Without writing any exploit, why does the first hunter usually win?
answer: more attack surface
accept: [more surface, bigger attack surface, more subdomains, more targets, wider surface]
hint: Bugs hide on the hosts nobody else enumerated.
```

## From name to netblock

Resolve a subdomain to its IP, look up the IP's **ASN** (the network block that owns it), and you often find the company's whole range — more hosts, some with no DNS name at all, sitting on ports you can scan.

```
dig +short api.target.com      -> 198.51.100.24
whois 198.51.100.24            -> AS64500  TARGET-CORP  198.51.100.0/24
```

The `/24` is 256 addresses that may belong to the target. DNS gave you names; the ASN gives you the ground under them.

```question
id: asn
prompt: You resolve a host to 198.51.100.24 and a whois shows it sits in AS64500 owned by the target, in the block 198.51.100.0/24. What did following the IP to its ASN just reveal — a single server, or a whole range of the target's hosts to scan?
answer: a whole range
accept: [a range, the netblock, more hosts, the ip range, a range of hosts, whole range]
hint: A /24 is 256 addresses, not one.
```

> You have not touched the target yet, and you already hold hundreds of hostnames and a block of IPs — most of it leaked by certificates and DNS that were never meant to be read as a map. Passive recon is free surface, and the hunter who gathers the most of it starts every hunt ahead.
