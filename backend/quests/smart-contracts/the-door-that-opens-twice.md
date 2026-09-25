---
slug: "sc-the-door-that-opens-twice"
title: "The Door That Opens Twice"
kingdom: "smart-contracts"
place: "cracks-in-vault"
order: 1
xp: 280
difficulty: 3
minutes: 35
requires: []
skills: ["logic"]
attributes: { exploitation: 3, logic: 2 }
summary: "The most famous smart-contract bug: a withdraw that sends the money before it writes down that you took it, so a re-entering attacker withdraws again and again from a balance that never drops."
---

**Reentrancy** is the vault bug that took down The DAO and started the field. It hinges on one ordering mistake: a function that sends ETH *before* it updates its own records. Because sending ETH to a contract hands control to that contract's code, the attacker re-enters the same function while the balance still reads full — and drains it in a loop.

## The fatal order

Read this withdraw, the whole of the bug:

```solidity
function withdraw() public {
    uint amount = balances[msg.sender];
    (bool ok, ) = msg.sender.call{value: amount}("");   // 1. send ETH (gives control away)
    require(ok);
    balances[msg.sender] = 0;                            // 2. update balance AFTER
}
```

The `call` on line 1 sends ETH to `msg.sender`. If that is an attacker contract, its `receive()` function runs *now* — before line 2 zeroes the balance — and it simply calls `withdraw()` again. The balance is still the full amount, so it pays out again. Loop until the vault is empty.

```question
id: reentrancy
prompt: A withdraw function sends ETH to the caller before setting their balance to zero, and the attacker's receive function calls withdraw again while the balance is still full. What is this vulnerability called?
answer: reentrancy
accept: [reentrancy, re-entrancy, a reentrancy attack, reentrancy attack]
hint: The attacker re-enters the function before it finishes.
```

## Why sending ETH is dangerous

The root cause is that `msg.sender.call{value:...}("")` transfers control to arbitrary code. Any external call — sending ETH, or calling another contract — may hand execution to an attacker who then calls back into you. Every external call is a place where the world can re-enter.

```question
id: external-call
prompt: The deeper reason reentrancy is possible is that a certain kind of operation hands execution to another contract's code mid-function. What operation is that?
answer: an external call
accept: [an external call, the external call, sending eth, a call to another contract, calling out, the low-level call, an external call/sending eth]
hint: Sending ETH or calling another contract runs its code, which can call back into you.
```

## The fix is an order and a lock

The defence is **checks-effects-interactions**: do your checks, then write your state changes (effects), and only then make the external call (interaction). Update the balance to zero *before* sending. A `nonReentrant` guard (a lock that reverts on re-entry) is the belt-and-braces version.

```question
id: cei
prompt: The standard pattern that prevents reentrancy is to perform checks, then update state, then make external calls — in that order. What is this ordering pattern called?
answer: checks-effects-interactions
accept: [checks-effects-interactions, checks effects interactions, cei, checks then effects then interactions, the cei pattern]
hint: Three steps, in that exact order.
```

## It is not only about ETH

Modern reentrancy also strikes through token callbacks (ERC-777, ERC-721 `onERC...Received`) and across functions — re-entering a *different* function that shares the same unupdated state (**cross-function reentrancy**). The audit question is always the same: does any external call happen before all the relevant state is finalised?

```question
id: audit-question
prompt: When auditing any function that makes an external call, what is the single question that reveals reentrancy risk?
answer: is state updated before the call
accept: [does the external call happen before state is updated, is state finalised before the call, is the state updated after the call, does it call out before updating state, is state written before the external call, whether state is updated before the interaction]
hint: You are checking whether any state change is left until after control is handed away.
```

> Reentrancy is one line in the wrong order: money sent before the ledger is updated, and a re-entering attacker paid from a balance that never falls. Read every external call as a door the world can come back through, and confirm the state was written and locked before it opened.
