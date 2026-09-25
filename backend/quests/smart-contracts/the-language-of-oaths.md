---
slug: "sc-the-language-of-oaths"
title: "The Language of Oaths"
kingdom: "smart-contracts"
place: "language-of-oaths"
order: 1
xp: 240
difficulty: 2
minutes: 30
requires: []
skills: ["auth"]
attributes: { logic: 2, exploitation: 1 }
summary: "Solidity is where the bugs are written. Visibility that leaves a function open, a modifier that guards the wrong thing, and the treacherous difference between msg.sender and tx.origin."
---

Contracts are written in **Solidity**, and most vulnerabilities are Solidity mistakes you can read straight from the source. You do not need to write contracts fluently to audit them — you need to know the handful of language features that decide *who can call what*, because that is where the vaults crack.

## Visibility decides who may call

Every function has a visibility: `public` and `external` are callable by anyone on the chain; `internal` and `private` only from within the contract (or its children). The classic disaster is a state-changing function — mint tokens, withdraw funds, set the owner — left `public` when it should have been `internal` or guarded, so *anyone* calls it.

```question
id: visibility
prompt: A function that transfers the contract's funds is declared public with no other restriction. Which two visibility keywords would have let any account on the chain call it?
answer: public and external
accept: [public and external, public, external, public or external, public/external]
hint: These two expose a function to every caller; internal and private do not.
```

## Modifiers are the locks

Access control is usually a **modifier** like `onlyOwner`, attached to a function so it reverts unless a condition holds:

```solidity
modifier onlyOwner() { require(msg.sender == owner, "not owner"); _; }
function setFee(uint f) public onlyOwner { fee = f; }
```

The bugs: a sensitive function missing its modifier entirely, or a modifier that checks the wrong thing. When auditing, list every state-changing function and confirm each has the right guard — most access-control findings are simply a missing `onlyOwner`.

```question
id: modifier
prompt: A sensitive setter function is missing the onlyOwner modifier that its siblings have, so any account can call it. What class of vulnerability is a missing access-control modifier?
answer: missing access control
accept: [missing access control, broken access control, access control, missing authorization, no access control, missing onlyowner]
hint: The lock that should guard the function is simply not there.
```

## The trap: msg.sender versus tx.origin

`msg.sender` is the *immediate* caller; `tx.origin` is the *original* EOA that started the whole transaction. Using `tx.origin` for authorization is a trap: if the owner is tricked into calling a malicious contract, that contract calls the vault, and `tx.origin` is still the owner — so the check passes for the attacker. Authorization must use `msg.sender`.

```question
id: tx-origin
prompt: A contract authorizes with require(tx.origin == owner). An attacker's contract, called by the owner, then calls the vault and the check passes. Why should tx.origin never be used for authorization?
answer: it is the original sender not the caller
accept: [it is the original account not the immediate caller, tx.origin is the original eoa, it lets an intermediary contract pass the check, phishing through a malicious contract, it is the origin not the direct caller, an intermediate contract abuses it]
hint: It stays the owner even when a malicious contract sits in the middle.
```

## Storage versus memory, and the rest

Two more that cause bugs: `storage` variables persist on-chain while `memory` ones are temporary, and confusing them can overwrite state unintentionally; and functions that handle ETH need a payable `receive`/`fallback`, which is exactly where reentrancy enters. You will meet these in the cracks — for now, know that the language's small rules are the whole attack surface.

```question
id: storage-memory
prompt: In Solidity, which data location persists on the blockchain between transactions — the one whose accidental use where a temporary copy was intended can corrupt the contract's state?
answer: storage
accept: [storage, the storage location, storage variables]
hint: Its opposite, memory, vanishes at the end of the call.
```

> Solidity is where the oaths are written and broken. Read the visibility of every function, check that each dangerous one carries the right modifier, and never trust `tx.origin`. The language's few rules about who-may-call are, quite literally, where the money is lost.
