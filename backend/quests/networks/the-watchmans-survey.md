---
slug: "net-the-watchmans-survey"
title: "The Watchman's Survey"
kingdom: "networks"
place: "watchmans-survey"
order: 1
xp: 240
difficulty: 2
minutes: 30
requires: []
skills: ["recon"]
attributes: { recon: 3, logic: 1 }
summary: "Count the doors and read what stands behind each. Nmap finds the open ports, names the service and its version, and its banners hand you the software to look up."
---

Infrastructure recon is a survey: for every host, which ports are open, what service answers on each, and which exact version it runs. `nmap` does all three, and the version is often the whole finding — an outdated service with a public exploit needs no cleverness, only that you looked.

## Count the open doors

A port scan sends probes and reports which ports answer:

```
nmap -p- 198.51.100.24

PORT     STATE  SERVICE
22/tcp   open   ssh
443/tcp  open   https
6379/tcp open   redis
9200/tcp open   elasticsearch
```

`-p-` scans all 65,535 ports so nothing hides on a high, forgotten one. Here the finds are `redis` and `elasticsearch` exposed — data stores that frequently run with no authentication at all.

```question
id: full-scan
prompt: You run nmap with -p- rather than the default. What does scanning all 65,535 ports protect you from missing — a service left on which kind of port?
answer: a high uncommon port
accept: [a high port, an uncommon port, a non-standard port, a forgotten high port, a high-numbered port, an unusual port]
hint: The default scan skips the high, rarely-used ports where a service may hide.
```

## Read what stands behind the door

Service and version detection (`nmap -sV`) does more than name the port — it fingerprints the exact software and version:

```
nmap -sV -p 443,6379 198.51.100.24

443/tcp  open  http   nginx 1.14.0
6379/tcp open  redis  Redis 4.0.9 (no auth)
```

`Redis 4.0.9` with no auth is a data store anyone can read and write; a specific web-server version can be matched to its known CVEs. The version is the pivot from "a port is open" to "this exact software has this exact, published bug."

```question
id: version
prompt: Service detection reveals a port runs Redis 4.0.9. Beyond knowing a service is there, what does the exact version let a hunter immediately look up?
answer: known CVEs
accept: [known cves, public exploits, known vulnerabilities, cves for that version, published exploits, known exploits, its cves]
hint: A precise version maps to precisely-published vulnerabilities.
```

## The banner that introduces itself

Many services announce themselves on connect — a **banner** with the software name, version, sometimes a hostname or a welcome message. Grabbing banners (nmap does it, or a raw `nc`) is often all fingerprinting takes, and banners leak internal details the service never meant to advertise.

```question
id: banner
prompt: Connecting to a service, it greets you with a line naming its software and version before you send anything. What is that self-identifying line called?
answer: a banner
accept: [a banner, the banner, service banner, a service banner, banner grabbing]
hint: You grab it to fingerprint the service.
```

## Build the map

The survey's output is a map: every live host, its open ports, the service and version on each. That map is the infrastructure attack surface — and just like the web, the win is usually the one host, one port, one version everyone else stopped short of enumerating.

```question
id: map
prompt: After scanning, you assemble every host, port, service and version into one picture to test against. What is that picture — the infrastructure equivalent of the attack surface you built in the Web Realm?
answer: the attack surface
accept: [the attack surface, the network map, an attack surface map, the attack surface map, a map of the surface]
hint: The full set of reachable services is the surface.
```

> The watchman counts every door and reads the name and age of what stands behind it. Scan all the ports, detect the exact versions, grab the banners, and map it — because an exposed Redis with no auth or a service one version behind its patch is a finding you earn simply by having looked harder.
