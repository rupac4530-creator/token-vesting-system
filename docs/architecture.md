# Token Vesting System — Architecture Design

## 1. System Overview

The Token Vesting System is a decentralized application (DApp) consisting of:

1. **Smart Contracts** (on-chain) — Handle token locking, vesting logic, and claims
2. **React Frontend** (off-chain) — User interface for interacting with contracts
3. **Wallet Integration** — MetaMask for transaction signing
4. **Blockchain Network** — SCAI Mainnet (EVM-compatible, Chain ID: 34)

---

## 2. Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    USER (Browser)                       │
│  ┌──────────────────────────────────────────────────┐   │
│  │              React Frontend (Vite)                │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────────────┐  │   │
│  │  │  Wallet  │ │  Create  │ │    Dashboard     │  │   │
│  │  │ Connect  │ │ Vesting  │ │  (View + Claim)  │  │   │
│  │  └────┬─────┘ └────┬─────┘ └────────┬─────────┘  │   │
│  │       │             │                │            │   │
│  │  ┌────▼─────────────▼────────────────▼─────────┐  │   │
│  │  │            ethers.js (v6)                    │  │   │
│  │  │    Contract ABI + Address + Provider         │  │   │
│  │  └────────────────────┬────────────────────────┘  │   │
│  └───────────────────────┼───────────────────────────┘   │
│                          │                               │
│  ┌───────────────────────▼────────────────────────────┐  │
│  │              MetaMask Wallet                        │  │
│  │    (Signs transactions, manages accounts)           │  │
│  └───────────────────────┬────────────────────────────┘  │
└──────────────────────────┼───────────────────────────────┘
                           │ JSON-RPC
                           ▼
┌──────────────────────────────────────────────────────────┐
│              SCAI Mainnet (Chain ID: 34)                 │
│  RPC: https://mainnet-rpc.scai.network                   │
│                                                          │
│  ┌────────────────────┐  ┌─────────────────────────┐     │
│  │   VestToken.sol     │  │   TokenVesting.sol      │     │
│  │   (ERC20 Token)     │  │   (Vesting Logic)       │     │
│  │                     │  │                         │     │
│  │  - name, symbol     │  │  - createVestingSchedule│     │
│  │  - totalSupply      │  │  - computeVestedAmount  │     │
│  │  - transfer         │  │  - claimVestedTokens    │     │
│  │  - approve          │  │  - revokeVesting        │     │
│  │  - balanceOf        │  │  - getVestingSchedule   │     │
│  └────────────────────┘  └─────────────────────────┘     │
│                                                          │
│  Explorer: https://explorer.securechain.ai               │
└──────────────────────────────────────────────────────────┘
```

---

## 3. Smart Contract Architecture

### 3.1 VestToken (ERC20)

A simple ERC20 token for demonstrating the vesting system.

```
VestToken
├── Constructor(name, symbol, initialSupply)
├── Standard ERC20 functions (transfer, approve, etc.)
└── Inherits: OpenZeppelin ERC20
```

### 3.2 TokenVesting (Core Contract)

```
TokenVesting
├── State Variables
│   ├── owner (address)
│   ├── vestingSchedules (mapping: id → VestingSchedule)
│   ├── schedulesByBeneficiary (mapping: address → id[])
│   └── scheduleCount (uint256)
│
├── Structs
│   └── VestingSchedule
│       ├── beneficiary (address)
│       ├── token (address)
│       ├── totalAmount (uint256)
│       ├── startTime (uint256)
│       ├── cliffDuration (uint256)
│       ├── vestingDuration (uint256)
│       ├── amountClaimed (uint256)
│       ├── revoked (bool)
│       └── initialized (bool)
│
├── Functions
│   ├── createVestingSchedule(...) → onlyOwner
│   ├── computeVestedAmount(scheduleId) → view
│   ├── getClaimableAmount(scheduleId) → view
│   ├── claimVestedTokens(scheduleId) → nonReentrant
│   ├── revokeVesting(scheduleId) → onlyOwner
│   ├── getVestingSchedule(scheduleId) → view
│   ├── getSchedulesByBeneficiary(address) → view
│   └── getScheduleCount() → view
│
└── Events
    ├── VestingScheduleCreated(scheduleId, beneficiary, totalAmount)
    ├── TokensClaimed(scheduleId, beneficiary, amount)
    └── VestingRevoked(scheduleId, amountRevoked)
```

### 3.3 Vesting State Machine

```
                    ┌─────────────┐
                    │   Created   │
                    │ (Schedule   │
                    │  active)    │
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              ▼            │            ▼
     ┌────────────┐        │     ┌──────────┐
     │   Cliff    │        │     │ Revoked  │
     │  (Locked)  │        │     │ (Admin   │
     │  No claims │        │     │  action) │
     └─────┬──────┘        │     └──────────┘
           │               │
           ▼               │
     ┌────────────┐        │
     │  Vesting   │────────┘
     │ (Linear    │
     │  release)  │
     └─────┬──────┘
           │
           ▼
     ┌────────────┐
     │  Fully     │
     │  Vested    │
     │ (100%)     │
     └────────────┘
```

---

## 4. Frontend Architecture

### 4.1 Component Tree

```
App
├── Header
│   ├── Logo + Title
│   └── WalletConnect (connect/disconnect button)
│
├── Main Content (conditionally rendered)
│   ├── HeroSection (when not connected)
│   │
│   ├── VestingDashboard (when connected)
│   │   ├── StatsCards (total locked, total claimed, active schedules)
│   │   ├── VestingScheduleList
│   │   │   └── VestingScheduleCard (per schedule)
│   │   │       ├── Progress bar
│   │   │       ├── Schedule details
│   │   │       └── Claim button
│   │   └── CreateVesting (admin only)
│   │       ├── Form inputs
│   │       └── Submit button
│   │
│   └── TransactionStatus (toast notifications)
│
└── Footer
    └── Links + Network info
```

### 4.2 State Management

```
React Context: Web3Provider
├── account (connected address)
├── provider (ethers.js BrowserProvider)
├── signer (for transactions)
├── chainId (current network)
├── isConnected (boolean)
├── vestingContract (Contract instance)
├── tokenContract (Contract instance)
└── connectWallet() / disconnectWallet()
```

---

## 5. Data Flow

### 5.1 Create Vesting Schedule

```
Admin UI → Form Data → ethers.js
    │
    ├── 1. token.approve(vestingContract, amount)
    │       → MetaMask signs → TX submitted → Wait for confirmation
    │
    └── 2. vesting.createVestingSchedule(beneficiary, token, amount, start, cliff, duration)
            → MetaMask signs → TX submitted → Wait for confirmation
            → Event: VestingScheduleCreated emitted
            → Frontend updates schedule list
```

### 5.2 Claim Tokens

```
Beneficiary UI → Click "Claim"
    │
    ├── 1. vesting.getClaimableAmount(scheduleId) → Read (no gas)
    │
    └── 2. vesting.claimVestedTokens(scheduleId)
            → MetaMask signs → TX submitted → Wait for confirmation
            → Event: TokensClaimed emitted
            → Frontend updates balances
```

---

## 6. Security Design

| Threat | Mitigation |
|--------|-----------|
| Reentrancy | ReentrancyGuard on claim functions |
| Unauthorized access | onlyOwner for admin functions, beneficiary checks for claims |
| Integer overflow | Solidity 0.8+ built-in checks |
| Double claiming | Track `amountClaimed` per schedule |
| Invalid inputs | require() checks on all parameters |
| Token theft | Only beneficiary can claim their tokens |
| Front-running | Not applicable (no MEV-sensitive operations) |

---

## 7. Technology Stack

| Layer | Technology |
|-------|-----------|
| Smart Contracts | Solidity 0.8.20+ |
| Contract Framework | Hardhat |
| Token Standard | OpenZeppelin ERC20 |
| Frontend | React 18 + Vite |
| Web3 Library | ethers.js v6 |
| Wallet | MetaMask |
| Styling | Vanilla CSS (dark theme) |
| Deployment | Vercel (frontend), SCAI Mainnet (contracts) |
| Testing | Hardhat + Chai |
