---
slug: "choosing-your-ground"
title: "Choosing Your Ground"
kingdom: "web"
place: "cartographers-tower"
order: 1
xp: 240
difficulty: 2
minutes: 30
requires: []
skills: ["recon"]
attributes: { recon: 2, restraint: 1 }
summary: "Before a single request: which program, what is actually in scope, and what the rules forbid. Most wasted hunts and most bans come from getting this wrong."
---

The most expensive mistakes happen before any testing: hunting the wrong program, testing an asset that was never in scope, or breaking a rule that gets you banned. The charter is dull and it is where professionals separate from the crowd — a bug outside scope is unpaid work, and a broken rule can end your account.

## Where the crowd is not

The instinct is to pile onto the newest, most famous program the day it launches — where a thousand other hunters are already testing the same login form. The edge is usually elsewhere: an older program with **wide scope** (`*.target.com` and many acquisitions), or an asset type others avoid, where surface has been added faster than it has been picked over.

```question
id: crowd
prompt: One hunter jumps on a brand-new, famous program on launch day alongside everyone else; another works an older program with a huge wildcard scope and many acquired domains. Why does the second often find more?
answer: less picked over
accept: [less competition, less crowded, more unexplored surface, fewer hunters, more surface to explore, less contested, wide scope less tested]
hint: New and famous means every easy bug was found in the first hours.
```

## Reading scope like a contract

Scope is a contract, and reporting outside it wastes everyone's time — or worse. Read a real one:

```
IN SCOPE:      *.target.com,  api.target.com,  the iOS app
OUT OF SCOPE:  blog.target.com (hosted on Medium),  *.thirdparty.com,  DoS, social engineering
```

`admin.target.com` matches the `*.target.com` wildcard — in scope. `blog.target.com` is explicitly carved out because the target does not control Medium's servers; a bug there is not theirs to fix and not yours to report here.

```question
id: scope
prompt: The scope lists *.target.com as in scope but names blog.target.com (hosted on Medium) as out of scope. Is admin.target.com in scope?
answer: yes
accept: [yes, yes it is, it is in scope, in scope]
hint: It matches the wildcard and is not one of the carve-outs.
```

```question
id: out-of-scope
prompt: You find a serious bug on blog.target.com, which the program explicitly lists as out of scope because a third party hosts it. Should you report it to this program for a bounty?
answer: no
accept: [no, no it is out of scope, do not report it here, it is out of scope]
hint: Out of scope means it is not this program's to pay or fix.
```

## The rules that end accounts

Rules of engagement are not suggestions. Common ones: no denial-of-service, no automated scanning if forbidden, no testing against other users' real accounts (use your own test accounts), no social engineering of staff. Running a loud automated scanner on a program that bans them is a fast way to be removed — regardless of what you find.

```question
id: roe
prompt: A program's rules forbid automated scanning, but you run a noisy vulnerability scanner across it anyway. What have you broken, risking removal from the program no matter what you find?
answer: the rules of engagement
accept: [rules of engagement, the rules, the program rules, the roe, the rules of engagement]
hint: The terms you agreed to before testing.
```

## The order of a hunt

With ground chosen and rules read, the workflow is always the same shape: enumerate the scope (subdomains, hosts, endpoints), probe what is live and what it runs, map the attack surface, then test — deepest where the surface is richest. Recon first, always: you cannot test what you have not found.

```question
id: workflow-order
prompt: Two hunters start a wide-scope program. One immediately tests the main login page; the other spends the first day enumerating hundreds of subdomains and endpoints first. Which approach usually surfaces the bugs nobody else found?
answer: recon first
accept: [enumerate first, recon first, mapping the surface first, the second, recon before testing, enumerate the scope first]
hint: You can only test the surface you have taken the trouble to find.
```

> The charter is where the hunt is won or lost before it starts: pick ground the crowd has not exhausted, read scope as the contract it is, obey the rules that protect your account, and always map before you test. None of it is exciting, and all of it is why some hunters get paid and others get banned.
