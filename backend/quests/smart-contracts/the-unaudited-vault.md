---
slug: "sc-the-unaudited-vault"
title: "The Unaudited Vault"
kingdom: "smart-contracts"
place: "unaudited-vault"
order: 1
xp: 500
difficulty: 5
minutes: 50
requires: []
skills: ["logic", "auth"]
attributes: { exploitation: 3, logic: 3, reporting: 1 }
summary: "One contract nobody has audited. Read it, find the cracks, prove each with an exploit, and write the report. The final trial of the Sealed Vaults."
---

You are given the source of `Vault.sol`, deployed and holding real funds, with no audit and no hints. This is the assessment as it arrives: a contract, its money, and everything the kingdom taught. Map its surface, break each crack you find, prove them with a runnable exploit, and report by severity — because on the chain, the proof is the point.

## Map the surface

You read the source and list every external function that touches value and who may call it.

```question
id: surface
prompt: Before testing, you read Vault.sol and list each external function, whether it changes state, and who may call it. What are you building?
answer: the attack surface
accept: [the attack surface, the attack surface map, an attack surface map, a map of the surface]
hint: The same map you build before testing anything.
```

## The lock that was never fitted

The contract has a `mint` function that creates tokens — and no access-control modifier on it.

```question
id: access
prompt: The mint function creates tokens and carries no onlyOwner or any check, so any account can call it. What class of vulnerability is that?
answer: missing access control
accept: [missing access control, broken access control, access control, no access control, missing authorization, missing onlyowner]
hint: The lock that should guard mint is simply absent.
```

## The door that opens twice

Its `withdraw` sends ETH to the caller before zeroing the caller's balance.

```question
id: reentrancy
prompt: withdraw sends ETH with a call before it updates the balance to zero, and your attacker contract's receive re-calls withdraw while the balance is still full. What vulnerability is that?
answer: reentrancy
accept: [reentrancy, re-entrancy, a reentrancy attack, reentrancy attack]
hint: The attacker re-enters before the balance falls.
```

## The wrong sender

An admin function guards itself with require(tx.origin == owner).

```question
id: tx-origin
prompt: An admin function checks tx.origin equals owner. Why is that exploitable if the owner is ever tricked into calling a malicious contract?
answer: tx.origin is the original sender not the caller
accept: [tx.origin is the original sender, it is the original eoa not the caller, an intermediary contract passes the check, tx.origin stays the owner through a middle contract, it is the origin not the direct caller, a malicious contract in the middle passes it]
hint: It should have used msg.sender.
```

## The price you can shove

The vault values a token by reading the ratio of a single DEX pool.

```question
id: oracle
prompt: The vault prices a token from one DEX pool's ratio. You flash-loan millions, swap to move that pool, and the vault now misprices the token. What is this attack called?
answer: price oracle manipulation
accept: [oracle manipulation, price manipulation, price oracle manipulation, oracle price manipulation]
hint: It trusted a price you could move with a flash loan.
```

## Prove it

Reading is not a report. You write a runnable exploit against a fork of the deployed contract that asserts the funds moved.

```question
id: poc
prompt: To turn these findings into an accepted report you write a test that forks the chain, runs each exploit, and asserts the vault was drained. Name a framework for writing such a proof-of-concept.
answer: Foundry
accept: [foundry, forge, hardhat, foundry or hardhat]
hint: forge (Foundry) or Hardhat.
```

## Report by severity

You hold unauthorized mint, reentrancy draining the vault, a tx.origin auth bypass, and an oracle manipulation. You lead the report with the finding of greatest impact and provide the runnable proof for each.

```question
id: lead
prompt: Between a gas-optimisation note and the reentrancy that drains the entire vault, which finding leads your audit report?
answer: the reentrancy
accept: [the reentrancy, reentrancy, the one that drains the vault, the vault-draining bug, the reentrancy drain]
hint: Lead with the greatest demonstrated impact.
```

> One unaudited contract, read end to end: the mint with no lock, the withdraw that opens twice, the admin check on the wrong sender, the price you shoved with borrowed millions — each proved with a Foundry exploit and reported by severity. There is no arguing with funds already moved. The Sealed Vaults are behind you.
