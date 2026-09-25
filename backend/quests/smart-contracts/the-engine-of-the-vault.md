---
slug: "sc-the-engine-of-the-vault"
title: "The Engine of the Vault"
kingdom: "smart-contracts"
place: "engine-of-vault"
order: 1
xp: 240
difficulty: 2
minutes: 30
requires: []
skills: ["logic"]
attributes: { recon: 1, logic: 2 }
summary: "Ethereum is the machine the vaults run on. Two kinds of account, transactions that carry the call, and storage anyone can read — learn the engine and the contract stops being mysterious."
---

Ethereum runs contracts on the **EVM**, a virtual machine every node executes identically. To read a vault you need its engine: who can act, how a call is made, and where the state lives. None of it is hidden — the whole point of the chain is that everyone computes the same result from the same public inputs.

## Two kinds of account

There are exactly two: an **EOA** (externally-owned account), controlled by a private key and the only thing that can *start* a transaction; and a **contract account**, which is code and storage with no key, acting only when an EOA (or another contract) calls it. A person is always an EOA at the root of every action.

```question
id: eoa
prompt: Ethereum has externally-owned accounts controlled by a private key and contract accounts that are code. Which type can actually originate a transaction — start the chain of calls?
answer: EOA
accept: [eoa, externally-owned account, an eoa, externally owned account, the eoa]
hint: Only the key-controlled kind can send the first transaction.
```

## The transaction carries the call

A transaction has a `to`, a `value` (ETH sent), and a `data` field — the **calldata** — that encodes which function to call and its arguments. The first four bytes of calldata are the **function selector** (a hash of the signature). Inside the contract, `msg.sender` is the immediate caller and `msg.value` is the ETH attached. Reading calldata tells you exactly what a transaction did.

```question
id: calldata
prompt: The field of a transaction that encodes which contract function to call and the arguments to pass it is called what?
answer: calldata
accept: [calldata, the calldata, the data field, call data]
hint: It is the "data" of the transaction; its first four bytes select the function.
```

```question
id: msg-sender
prompt: Inside a contract function, which value tells the code the address of the account or contract that directly called it — the identity most access-control checks rely on?
answer: msg.sender
accept: [msg.sender, msgsender, msg sender, the msg.sender]
hint: The message's sender.
```

## Storage is on the chain, in the open

A contract's state lives in numbered **storage** slots on the chain. It is public — even variables the code calls `private` can be read slot by slot with an RPC call. So when you audit, you can inspect every value the contract holds and watch how each function changes it.

```question
id: storage
prompt: A contract keeps a variable it declared private. Because contract storage lives openly on the chain, can you still read that value directly from the storage slot?
answer: yes
accept: [yes, yes you can, storage is public, it is readable, yes it is public]
hint: The private keyword is a Solidity access keyword, not encryption of the chain.
```

## The ABI is the interface

To call a contract you need its **ABI** — the description of its functions and types — the smart-contract equivalent of an API spec. With the ABI (often published, or recovered from the bytecode) you can call any external function directly, exactly as you called API routes without the UI.

```question
id: abi
prompt: To call a contract's functions directly you use its ABI. In web terms from an earlier kingdom, the ABI plays the same role as which document that describes an API's routes and types?
answer: the OpenAPI spec
accept: [the openapi spec, openapi, swagger, the api spec, the api specification, a spec, openapi/swagger]
hint: It is the interface definition — like the spec that let you call an API with no UI.
```

> The engine is simple once named: an EOA starts every action, calldata carries the call, storage holds the state in the open, and the ABI is the interface to it all. With those, a contract is just another program whose every input and every variable you can see — and money is riding on each one.
