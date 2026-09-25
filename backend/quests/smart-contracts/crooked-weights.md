---
slug: "sc-crooked-weights"
title: "Crooked Weights"
kingdom: "smart-contracts"
place: "cracks-in-vault"
order: 3
xp: 300
difficulty: 4
minutes: 40
requires: []
skills: ["logic"]
attributes: { exploitation: 2, logic: 3 }
summary: "The economic bugs: a price the attacker moves with borrowed millions, a number that wraps past zero, a transaction the whole world sees before it lands, a signature with no nonce."
---

The subtlest vault bugs are not about permission but about *value* — the contract's maths and its trust in prices. With a flash loan an attacker wields millions for a single transaction, so any value a contract reads from a place the attacker can move becomes a weapon. These are the DeFi bugs, and the largest thefts in the field.

## The price you can shove

Many contracts read an asset's price from an on-chain source. If that source is a single DEX pool, the price is just the pool's ratio — and a big enough trade moves it. Combined with a **flash loan** (borrow a fortune with no collateral, so long as you repay it within the same transaction), an attacker shoves the price, exploits the contract that trusted it, and repays — all atomically.

```question
id: oracle
prompt: A lending contract reads a token's price from a single DEX pool. An attacker flash-loans millions, swaps to move that pool's ratio, and the contract now values the token wrongly. What is this class of attack called?
answer: price oracle manipulation
accept: [oracle manipulation, price manipulation, price oracle manipulation, oracle price manipulation, manipulating the oracle]
hint: The contract trusted a price the attacker could move.
```

```question
id: flash-loan
prompt: A flash loan lets an attacker borrow a huge sum with no collateral. What is the one condition that makes the loan valid, and which is why the whole attack must fit in a single transaction?
answer: it is repaid in the same transaction
accept: [repay it in the same transaction, it must be repaid in the same tx, repaid within the transaction, pay it back in the same transaction, repay within one transaction, repaid atomically]
hint: Borrow and repay must happen atomically, or the transaction reverts.
```

## The number that wraps

Before Solidity 0.8, arithmetic silently **overflowed and underflowed**: subtract 1 from a balance of 0 and it wraps to the maximum value, minting a fortune from nothing. Modern Solidity reverts on this by default, but `unchecked` blocks, older contracts, and manual casts bring it back. A balance that can go below zero is a red flag anywhere.

```question
id: overflow
prompt: In an older contract, subtracting more than a balance holds makes the unsigned number wrap around to an enormous value instead of reverting. What are these two failures called together?
answer: integer overflow and underflow
accept: [integer overflow and underflow, overflow and underflow, integer overflow, underflow, integer overflow/underflow, overflow/underflow]
hint: The number rolls over past its maximum or below zero.
```

## The transaction everyone sees coming

Your transaction sits in the public **mempool** before it is mined, so bots read it and react. A bot that sees your profitable trade can submit its own with higher gas to execute first — **front-running** — capturing the gain. This whole economy is MEV (maximal extractable value), and contracts that assume transaction order is private are wrong.

```question
id: front-running
prompt: A bot watches the public mempool, sees your profitable pending transaction, and submits its own with higher gas so it is mined first and takes the profit. What is this called?
answer: front-running
accept: [front-running, frontrunning, front running, a front-run, mev front-running]
hint: The bot runs in front of your transaction.
```

## The signature reused

Contracts often accept a signed message to authorise an action off-chain. If the signed data has no **nonce** (a one-time number) or no expiry, the same signature is **replayed** — submitted again for a second effect, or on another chain. Signature bugs also include malleability and missing domain separation.

```question
id: signature-replay
prompt: A contract accepts a signed permit to move funds, but the signed message contains no nonce or expiry. What can an attacker do with a valid signature they have seen once?
answer: replay it
accept: [replay it, reuse it, replay the signature, submit it again, use it again, signature replay, replay the permit]
hint: With nothing marking it single-use, the same signature works twice.
```

> The crooked weights are economic: a price shoved with borrowed millions, a number that wraps below zero, a transaction the mempool reveals before it lands, a signature no nonce made single-use. Audit every value a contract *trusts* — where it comes from, whether the attacker can move it, and whether it can be replayed — because in a vault, bad maths is stolen money.
