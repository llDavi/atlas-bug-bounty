---
slug: "sc-the-ledger-of-stone"
title: "The Ledger of Stone"
kingdom: "smart-contracts"
place: "ledger-of-stone"
order: 1
xp: 220
difficulty: 2
minutes: 30
requires: []
skills: ["logic"]
attributes: { recon: 1, logic: 2 }
summary: "A blockchain is a public, permanent ledger no one can edit. That single fact rewrites the rules: your code is visible to all, your bug is forever, and a key is the only password there is."
---

A blockchain is a ledger written in stone: a public, append-only record replicated across thousands of nodes that agree, by consensus, on one shared state. Nothing about hunting here resembles the web until you accept three consequences of that stone — everything is visible, nothing can be edited, and there is no one to reset your password. Money lives directly in this code, so the stakes are absolute.

## Everything is public

Every contract's code, every variable it stores, and every transaction ever made are visible to anyone. There is no hidden endpoint, no private field, no security by obscurity — a `private` variable in the code is still readable straight from the chain's storage. You audit with the full source and full state in hand.

```question
id: public
prompt: A contract marks a variable as private in its code. Can its value still be read directly from the blockchain's storage by anyone?
answer: yes
accept: [yes, yes it can, it is still readable, private only hides it from other contracts, yes storage is public]
hint: The private keyword limits access from other contracts, not from a person reading the chain.
```

## Nothing can be edited

Once a contract is deployed, its code is immutable — you cannot push a patch. A bug is permanent, and an attacker can exploit it until the funds are gone or the contract is abandoned. This is why an *audit before deployment* matters more than anywhere else: there is no "fix it in production."

```question
id: immutable
prompt: A deployed contract has a critical bug. Unlike a web app where the team pushes a fix, why can they usually not simply patch the contract's code?
answer: it is immutable
accept: [it is immutable, the code cannot be changed, contracts are immutable, you cannot edit it, immutability, the code is permanent, it cannot be patched]
hint: What is written in stone stays as written.
```

## A key is the only password

An address is controlled by a **private key**. Whoever holds the key holds the funds — completely, and there is no reset, no support line, no recovery. A leaked key is not a step toward compromise; it *is* the compromise.

```question
id: key
prompt: An account on a blockchain is controlled entirely by its private key, with no password reset or recovery. What does an attacker who obtains that private key gain?
answer: full control of the funds
accept: [full control, control of the account, the funds, everything, total control, control of the funds, the account and its money]
hint: The key is the account; there is nothing else guarding it.
```

## The attacker pays, but the vault is the prize

Every operation costs **gas**, paid by whoever sends the transaction — so an attacker pays to attack. That barely matters: gas is cents, and the target is often a contract holding millions. The economics are lopsided in the attacker's favour, which is why smart-contract bounties and thefts are the largest in the field.

```question
id: gas
prompt: Attacking a contract costs the attacker gas for each transaction. Why is that cost rarely a deterrent?
answer: the prize is far larger
accept: [gas is cheap, the reward is far bigger, the vault holds millions, gas is negligible, the payoff dwarfs it, the target holds much more, cheap compared to the loot]
hint: A few cents of gas against a vault of millions.
```

> The stone changes everything: the code and state are open to all, the bug you find can never be patched, and a private key is the whole of security. Read the vaults knowing there is nowhere to hide a flaw and no way to fix one — which is exactly why finding it first is worth so much.
