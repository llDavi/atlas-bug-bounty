---
slug: "the-report"
title: "The Report"
kingdom: "web"
place: "cartographers-tower"
order: 3
xp: 260
difficulty: 2
minutes: 30
requires: []
skills: ["logic"]
attributes: { reporting: 3, restraint: 1 }
summary: "The bug is only half the work. A report a triager can reproduce in one minute, rated honestly, sent professionally, gets paid — a brilliant finding, badly written, gets closed."
---

Finding the bug is half the job; the other half is a report that gets it fixed and paid. Triagers handle hundreds of submissions; the one they can reproduce in a minute, that states real impact and rates it honestly, rises to the top. The same bug, in a vague or dramatic report, gets marked *not reproducible* and closed.

## What the triager actually needs

A report is a recipe. It needs exact, numbered **steps to reproduce**, the precise request (a `curl` line, or the raw request), what you expected, what happened, and the **impact** in one clear sentence. If a triager cannot reproduce it from your steps alone, nothing else about the report matters.

```question
id: repro
prompt: A triager handles hundreds of reports a week. What is the single most important thing your report must contain for them to accept it?
answer: clear steps to reproduce
accept: [steps to reproduce, a clear proof of concept, reproduction steps, exact steps to reproduce, a reproducible poc, how to reproduce it]
hint: If they cannot reproduce it from your report, it is closed regardless of the bug.
```

## Impact, stated plainly

Rate the bug by what an attacker can actually do, usually with a **CVSS** vector to justify the severity. The difference between a triage and a bounty is often the impact sentence: "reflected XSS present" is weak; "reflected XSS in the admin console steals the admin session cookie, enabling full account takeover of any administrator" tells them exactly why it is critical.

```question
id: impact-writing
prompt: Two reports describe the same XSS. One says only "XSS is present on the search page." The other explains it steals the admin session and enables account takeover. Which one is far more likely to be paid, and why?
answer: the one that states impact
accept: [the one showing impact, the second, the one with impact, the one that explains the consequence, the impact-focused one, the one describing account takeover]
hint: Bounties track demonstrated impact, not the mere presence of a bug.
```

## One bug, one report, and the duplicate

Keep one vulnerability per report — bundling three makes triage and payment a mess. And before you send, check the program's disclosed reports: if someone reported the same issue first, yours is a **duplicate** and will not be paid, however good it is. Speed and unique surface are how you avoid dupes.

```question
id: duplicate
prompt: You submit a solid finding, but the program had already received the same bug from another hunter last week. What status will your report be given?
answer: duplicate
accept: [duplicate, a duplicate, marked duplicate, dupe, it is a duplicate]
hint: First to report a given bug is the one who is paid for it.
```

## Staying in the light

Professional conduct sustains a career: communicate with triage calmly (provide more proof rather than argue a rating rudely), never test beyond scope to "prove" more, and practise **responsible disclosure** — do not go public with an unfixed vulnerability, and give the vendor time to remediate before any write-up.

```question
id: disclosure
prompt: You find a critical bug and, frustrated by a slow response, consider posting the full details publicly before it is fixed. Which principle does going public with an unpatched vulnerability violate?
answer: responsible disclosure
accept: [responsible disclosure, coordinated disclosure, responsible/coordinated disclosure]
hint: The vendor gets time to fix before the world learns how.
```

> The report is the deliverable. Make it reproducible in a minute, state the impact plainly, keep it to one bug, beat the duplicate, and stay professional and in scope. A mediocre bug in an excellent report gets fixed and paid; a brilliant bug in a poor one gets closed — and this is the last lesson of the realm before the Nameless City, where you walk all of it alone.
