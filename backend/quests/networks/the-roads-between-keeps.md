---
slug: "net-the-roads-between-keeps"
title: "The Roads Between Keeps"
kingdom: "networks"
place: "roads-between-keeps"
order: 1
xp: 220
difficulty: 2
minutes: 30
requires: []
skills: ["recon"]
attributes: { recon: 2, logic: 1 }
summary: "Not a networking course — the slice a hunter needs. A host is an address, a service is a port, and a firewall is a list of which doors it will open to whom."
---

The networks kingdom is not about memorising protocol layers; it is about seeing infrastructure as a hunter does. A target is a set of hosts, each host an address, each address answering on numbered doors called ports, and in front of them a firewall deciding which doors open to whom. Learn that much and the whole spires become a map of doors to try.

## A host is an address, a service is a port

Every host has an **IP address**; every network service listens on a **port**. The port is the service's identity: 22 is SSH, 3389 is RDP, 3306 is MySQL, 6379 is Redis, 80 and 443 are web. A host is only as exposed as the ports it answers on, so the whole first move against infrastructure is: which ports are open, and what is behind each?

```question
id: port
prompt: A host answers on port 6379. Knowing that number identifies the service, what is a hunter's immediate takeaway — that a certain kind of service (a Redis database) is reachable there?
answer: a service is exposed on it
accept: [a service is listening, redis is exposed, a database is reachable, a service runs there, redis is reachable, there is a service on that port, an exposed service]
hint: The port number names the service behind the door.
```

## TCP asks first, UDP just shouts

Most services ride **TCP**, which handshakes before it speaks — which is why a scanner can tell an open TCP port (it answers the handshake) from a closed one. **UDP** is connectionless (DNS, some databases), harder to scan but not to be forgotten. For the hunter, the point is that "open port" is a thing you can reliably discover on TCP.

```question
id: tcp
prompt: A port scanner reliably tells open from closed TCP ports because TCP does something before exchanging data that UDP does not. What is that?
answer: a handshake
accept: [a handshake, the three-way handshake, it handshakes, a three-way handshake, tcp handshake]
hint: TCP shakes hands to open a connection.
```

## The firewall is a guest list

A **firewall** (in the cloud, a *security group*) is a list of rules: which source addresses may reach which ports. A well-run host exposes 443 to the world and 22 only to the office. The bugs are in the list: a database port open to `0.0.0.0/0` (everyone), an admin port left world-reachable. The firewall's mistakes are the hunter's open doors.

```question
id: firewall
prompt: A cloud security group has a rule allowing port 3306 (MySQL) from source 0.0.0.0/0. What does that source range mean, and why is it a finding?
answer: it is open to everyone
accept: [open to the whole internet, open to everyone, any source, the entire internet, world-reachable, exposed to all, everyone can reach it]
hint: 0.0.0.0/0 is every address there is.
```

## DNS still names the ground

DNS, from the Web Realm, is infrastructure recon here too: it maps names to the IPs you will scan, and its records (MX, TXT, SRV, and internal zones) reveal hosts and services. Resolve the target's names, gather the IPs, and you have the addresses whose doors you will now go and count.

```question
id: dns
prompt: Before scanning any ports, you use DNS to turn the target's hostnames into the IP addresses you will scan. What does DNS provide that starts the whole infrastructure survey?
answer: the IP addresses
accept: [the ip addresses, the ips, host to ip mapping, the addresses, names to ips, the ip addresses to scan]
hint: It maps names to the addresses you go and probe.
```

> Infrastructure, hunter-sized: hosts are addresses, services are ports, the firewall is a guest list that is often too generous, and DNS hands you the addresses to start on. You do not need the whole networking book — you need to see every open door and ask what is behind it.
