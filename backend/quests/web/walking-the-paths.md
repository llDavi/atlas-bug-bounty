---
slug: "walking-the-paths"
title: "Walking the Paths"
kingdom: "web"
place: "forest-of-recon"
order: 2
xp: 240
difficulty: 2
minutes: 35
requires: []
skills: ["recon"]
attributes: { recon: 3, patience: 1 }
summary: "Now you touch the target: which hosts are alive, what they run, which virtual host answers, and what paths exist that nobody links to."
---

You have a list of hundreds of names. Active recon turns that list into a map: which hosts actually answer, what software they run, and which paths exist behind them. This is where you start sending requests — and where a good methodology beats a big scanner.

## Which of the names are actually alive

Most of a subdomain list is dead — old records, parked names, internal-only hosts. `httpx` probes each one and keeps the live web servers, with their status and title:

```
cat subs.txt | httpx -sc -title -td -silent

https://api.target.com       [200] [Swagger UI]          [nginx]
https://staging.target.com   [401] [Restricted]          [Apache]
https://grafana-dev.target.com [200] [Grafana]           [Grafana]
```

Three findings already: an API with **Swagger UI** exposed (its whole documented surface), a staging box behind auth (worth a closer look), and a Grafana that answered `200` with no login in the title.

```question
id: httpx
prompt: You run httpx over 412 subdomains and only 90 answer as live web servers. What is the job of that step — to exploit the hosts, or to filter the list down to the ones actually worth testing?
answer: filter
accept: [filter the list, find live hosts, narrow it down, find the live ones, filter down]
hint: Most names on a big list are dead; you want the ones that answer.
```

## What they run

Fingerprinting tells you the stack, and the stack tells you which bugs to reach for. It is mostly in the response — headers and a few tells:

```http
HTTP/1.1 200 OK
Server: nginx
X-Powered-By: PHP/5.6.40
Set-Cookie: PHPSESSID=...; path=/
X-Generator: Drupal 7 (https://www.drupal.org)
```

`PHP/5.6.40` is years out of support, and `Drupal 7` reached end-of-life — a hunter now knows to check the public CVEs for exactly those versions before writing anything original.

```question
id: fingerprint
prompt: A response reveals X-Powered-By PHP 5.6.40 and X-Generator Drupal 7 — both long past end-of-life. Before inventing a new bug, what is the fast first move fingerprinting has handed you?
answer: check known CVEs
accept: [known cves, look up cves, public exploits, known vulnerabilities, check cves, known exploits]
hint: Old, unsupported versions usually have public, already-written exploits.
```

## The host that only answers to its true name

One IP often serves many sites, choosing by the `Host` header — **virtual hosts**. A box may serve `www.target.com` to everyone but hold an `admin.target.com` vhost that never appears in DNS. Point requests at the IP and fuzz the `Host` header, and the hidden vhost answers differently:

```
ffuf -u https://198.51.100.24 -H "Host: FUZZ.target.com" -w subs.txt -fs 4242
```

`-fs 4242` filters out the default page's size, so only a vhost that responds *differently* shows up.

```question
id: vhost
prompt: One server answers www.target.com to everyone, but fuzzing the Host header uncovers an admin vhost on the same IP that appears in no DNS record. Which header did you fuzz to find it?
answer: Host
accept: [the host header, host header]
hint: It is the header that tells one IP which site you want.
```

## The paths nobody links to

The pages in the menu are not the application. Content discovery brute-forces paths from a wordlist to find the ones with no link — `/admin`, `/backup.zip`, `/.git/config`, `/api/v1/internal`:

```
ffuf -u https://api.target.com/FUZZ -w raft-medium-words.txt -mc 200,301,401,403 -ac

/.git/config      [200]   <-- source-code leak
/actuator/env     [200]   <-- Spring secrets
/backup.sql       [200]   <-- database dump
```

A reachable `/.git/config` means you can often reconstruct the whole source tree; `/actuator/env` on a Spring app spills environment secrets. None of these were linked; a wordlist found them.

```question
id: content-discovery
prompt: Brute-forcing paths with a wordlist turns up /.git/config returning 200 on a live host. Beyond a single file, what does an exposed .git directory usually let a hunter recover?
answer: the source code
accept: [source code, the source, the repository, the codebase, whole source]
hint: The .git folder is the whole version history of the app.
```

> Active recon is the turn from a list of names to a map of live software and reachable paths. Probe what is alive, read what it runs, find the vhost with no DNS and the path with no link — most of the surface a program forgets to defend is found right here, before any single bug.
