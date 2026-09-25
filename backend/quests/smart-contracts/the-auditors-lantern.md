---
slug: "sc-the-auditors-lantern"
title: "The Auditor's Lantern"
kingdom: "smart-contracts"
place: "auditors-lantern"
order: 1
xp: 260
difficulty: 3
minutes: 35
requires: []
skills: ["logic"]
attributes: { recon: 2, reporting: 2 }
summary: "How the work is actually done: map the attack surface by reading the source, let the tools flag the known patterns, and prove the bug with a runnable exploit — because a vault report is a working proof, not a warning."
---

Auditing a vault is not guesswork; it is method. You read the source to map every function that touches value and asks who may call it, let static tools flag the well-known patterns, and then *prove* the bug by writing an exploit that actually drains a test copy. In this kingdom the deliverable is a runnable proof-of-concept, because on an immutable chain a warning is worth little and a demonstration is worth the vault.

## Map the surface by reading

Start by listing, from the source: every `external`/`public` function, whether each changes state, who is allowed to call it, and how value flows in and out. That map is the attack surface — the reentrancy lives on the functions with external calls, the access bugs on the ones missing modifiers, the economic bugs on the ones reading a price. Reading with intent finds most of it.

```question
id: surface
prompt: The first step of a smart-contract audit is to read the source and list, for each external function, whether it changes state and who may call it. What are you building by doing this?
answer: the attack surface
accept: [the attack surface, an attack surface map, the attack surface map, a map of the attack surface]
hint: The same thing you mapped in every kingdom before testing.
```

## Let the tools flag the patterns

**Slither** is static analysis for Solidity: it parses the contract and flags known-dangerous patterns — reentrancy, unchecked calls, missing access control, dangerous `delegatecall`, shadowed variables — in seconds. It produces false positives and misses logic bugs, but it clears the obvious ground so you spend your time on what needs a human.

```question
id: slither
prompt: Which static-analysis tool parses Solidity and automatically flags known-dangerous patterns like reentrancy and missing access control, clearing the obvious findings before manual review?
answer: Slither
accept: [slither, the slither tool]
hint: A widely used open-source static analyser for smart contracts.
```

## Prove it with a runnable exploit

The proof is code. In **Foundry** (`forge`) you write a test that forks mainnet state, deploys the target, and runs your exploit — then asserts the vault was drained or the owner changed:

```solidity
function testDrain() public {
    // fork the real contract, run the attack, assert the loss
    attacker.exploit(vault);
    assertGt(attacker.balance, 0);
}
```

Because it forks real state, the test reproduces the bug against the actual deployed contract. Hardhat does the same in JavaScript. A vault report leads with this: a test anyone can run to watch the funds move.

```question
id: foundry
prompt: To prove a smart-contract bug, you write a test that forks the real chain state and runs your exploit, asserting the funds were drained. Name one framework used to write such a runnable proof-of-concept.
answer: Foundry
accept: [foundry, forge, hardhat, foundry or hardhat, foundry/forge]
hint: The Rust-based one is called Foundry (its command is forge); the JS one is Hardhat.
```

## When reading is not enough: fuzz it

Logic bugs hide in states no one thought to test. **Fuzzing** throws thousands of random inputs at the contract and checks that an **invariant** — "total supply always equals the sum of balances", "the vault never pays out more than deposited" — never breaks. Foundry's invariant testing and symbolic execution find the edge cases a human misses.

```question
id: fuzzing
prompt: You define a rule that must always hold — the vault never pays out more than was deposited — and let the tool throw thousands of random inputs at the contract to try to break it. What is testing against an always-true rule this way called (defining and checking an ___)?
answer: invariant
accept: [invariant, an invariant, invariant testing, checking an invariant, invariants]
hint: The rule that must always stay true, whatever the inputs.
```

> The lantern is method, not luck: read the source to map who-may-touch-value, let Slither clear the known patterns, fuzz the invariants for the states you did not imagine, and prove the finding with a Foundry test that drains a fork. In the vaults, the report is the exploit — a proof anyone can run, because there is no arguing with the funds already moved.
