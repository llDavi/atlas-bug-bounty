---
slug: "sc-who-holds-the-keys"
title: "Who Holds the Keys"
kingdom: "smart-contracts"
place: "cracks-in-vault"
order: 2
xp: 290
difficulty: 4
minutes: 40
requires: []
skills: ["auth"]
attributes: { exploitation: 3, logic: 2 }
summary: "The functions that should belong to the owner and belong to no one: an initializer anyone can call, a delegatecall that runs an attacker's code in your storage, an admin function without its lock."
---

After reentrancy, the deadliest vault bugs are about *who holds the keys* — access control gone wrong. A privileged function with no guard, an initializer left open, or a `delegatecall` that runs foreign code inside your own storage: each hands the whole contract to whoever asks first. These are the bugs that have emptied the largest vaults.

## The lock that was never fitted

The plainest version: a function that mints tokens, moves funds, or changes the owner, with no `onlyOwner` and no check. It is simply callable by anyone. Auditing is listing every state-changing function and finding the one whose lock is missing.

```question
id: missing-guard
prompt: A function named setOwner lets the caller become the contract owner and has no access-control check at all. What does any account do to seize the contract?
answer: call it
accept: [call it, just call it, call the function, invoke it, call setowner, anyone can call it]
hint: With no lock, the function does exactly what it says for whoever calls.
```

## The door left unlocked at birth

Upgradeable contracts separate deployment from setup: a constructor is replaced by an `initialize()` function meant to be called once, by the deployer, to set the owner. When it is left callable by anyone and was never invoked (or can be re-invoked), an attacker calls it and becomes owner. This is the **uninitialized proxy / initialization** bug that froze hundreds of millions in the Parity wallet.

```question
id: init
prompt: An upgradeable contract's initialize function, which sets the owner, has no protection and was never called after deployment. What does an attacker do?
answer: call initialize and become owner
accept: [call initialize, call it and become the owner, initialize it themselves, call initialize to take ownership, become owner by initializing, call the initializer]
hint: Whoever runs the one-time setup becomes the owner it appoints.
```

## Running another's code in your own house

`delegatecall` executes *another contract's code* but in *your* storage and with your address. It is how proxies and libraries work — and a catastrophe if the called address is attacker-controlled or points at code that can be made to overwrite your storage. The attacker's logic runs as if it were yours, so it can rewrite the owner slot or `selfdestruct` the contract.

```question
id: delegatecall
prompt: A contract uses delegatecall to an address an attacker can influence. Because delegatecall runs the target's code in the caller's own storage context, what can the attacker's code do to the calling contract?
answer: overwrite its storage
accept: [overwrite its storage, change its state, take over its storage, rewrite the owner, control its storage, modify its storage, take control of it, overwrite storage and take over]
hint: Foreign code runs against your storage as if it were your own.
```

## The upgrade that changes everything

Proxy patterns keep storage in one contract and logic in another you can swap. The risks cluster there: an unprotected upgrade function (anyone points the proxy at malicious logic), a **storage layout mismatch** between proxy and implementation (variables collide and corrupt), and the initializer problem above. When you see a proxy, audit who can upgrade it and whether the layouts line up.

```question
id: proxy
prompt: In an upgradeable proxy, which single function is the most dangerous to leave without strict access control, since calling it repoints the contract at new logic?
answer: the upgrade function
accept: [the upgrade function, upgrade, the upgradeto function, the function that sets the implementation, the upgrade/upgradeto function, the implementation setter]
hint: It swaps the logic the proxy runs; anyone who calls it owns the contract's behaviour.
```

> The keys are lost the same few ways: a privileged function with no lock, a one-time initializer anyone can run, a `delegatecall` that lets foreign code rewrite your storage, an upgrade function left open. Find every function that changes ownership, funds, or logic, and ask the one question — who, exactly, is allowed to call this?
