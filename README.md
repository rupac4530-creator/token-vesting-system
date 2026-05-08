# 🔒 Token Vesting System

A decentralized application (DApp) for managing token vesting schedules with cliff periods and linear release on the **SCAI Mainnet** (SecureChain AI).

## 🎯 Overview

Token vesting locks ERC20 tokens in a smart contract and releases them gradually over time. This prevents early selling, ensures long-term commitment, and is widely used by crypto projects for founder tokens, employee allocations, and investor distributions.

## ✨ Features

- **Create Vesting Schedules** — Lock tokens with configurable cliff and duration
- **Linear Vesting** — Tokens release proportionally over time after the cliff
- **Cliff Periods** — No tokens available during the initial lock period
- **Claim Tokens** — Beneficiaries claim vested tokens at any time
- **Revoke Vesting** — Admin can revoke unvested tokens (vested portions remain claimable)
- **Multiple Schedules** — Support multiple schedules per beneficiary
- **MetaMask Integration** — Connect wallet, auto-detect network, switch chains
- **Real-time Dashboard** — View vesting progress, stats, and transaction status
- **Security** — ReentrancyGuard, SafeERC20, access control, input validation

## 🏗️ Architecture

```
User (Browser + MetaMask)
    │
    ├── React Frontend (Vite)
    │   └── ethers.js v6
    │
    ▼
SCAI Mainnet (Chain ID: 34)
    ├── VestToken (ERC20)
    └── TokenVesting (Vesting Logic)
```

## 📁 Project Structure

```
token-vesting-system/
├── contracts/
│   ├── VestToken.sol          # ERC20 token
│   └── TokenVesting.sol       # Core vesting contract
├── scripts/
│   └── deploy.js              # Deployment script
├── test/
│   ├── TokenVesting.test.js   # Unit tests (24 tests)
│   └── Security.test.js       # Security tests (9 tests)
├── frontend/
│   └── src/
│       ├── components/        # React components
│       ├── hooks/             # useWallet, useContract
│       ├── utils/             # constants, helpers
│       └── abi/               # Contract ABIs
├── docs/
│   ├── requirements.md
│   ├── architecture.md
│   └── decisions.md
├── hardhat.config.js
└── README.md
```

## 🔧 Tech Stack

| Layer | Technology |
|-------|-----------|
| Smart Contracts | Solidity 0.8.20, OpenZeppelin |
| Framework | Hardhat |
| Frontend | React 19 + Vite |
| Web3 | ethers.js v6 |
| Wallet | MetaMask |
| Network | SCAI Mainnet (Chain ID: 34) |
| Deployment | Vercel (frontend) |

## 🚀 Quick Start

### Prerequisites

- Node.js 22+
- MetaMask browser extension
- SCAI tokens for gas fees

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd token-vesting-system

# Install smart contract dependencies
npm install

# Install frontend dependencies
cd frontend
npm install
cd ..
```

### Compile & Test Smart Contracts

```bash
# Compile contracts
npx hardhat compile

# Run all tests (33 tests)
npx hardhat test
```

### Deploy Contracts

```bash
# Create .env file
cp .env.example .env
# Edit .env and add your PRIVATE_KEY

# Deploy to SCAI Mainnet
npx hardhat run scripts/deploy.js --network scai
```

### Run Frontend Locally

```bash
cd frontend
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## 📋 Smart Contract Details

### VestToken (ERC20)
- Standard ERC20 token with configurable decimals
- Initial supply minted to deployer

### TokenVesting
- `createVestingSchedule()` — Create new vesting schedule (owner only)
- `claimVestedTokens()` — Claim available vested tokens (beneficiary only)
- `revokeVesting()` — Revoke unvested tokens (owner only)
- `computeVestedAmount()` — View total vested amount
- `getClaimableAmount()` — View claimable (unclaimed vested) amount
- `getVestingSchedule()` — View full schedule details
- `getSchedulesByBeneficiary()` — Get all schedule IDs for an address

### Security Features
- `ReentrancyGuard` on claim and revoke functions
- `SafeERC20` for token transfers
- Checks-effects-interactions pattern
- Input validation on all parameters
- Owner-only access control for admin functions

## 🧪 Testing

33 tests covering:
- ✅ Deployment validation
- ✅ Schedule creation (valid + invalid inputs)
- ✅ Vesting computation (before cliff, after cliff, full duration)
- ✅ Token claiming (partial, full, double-claim prevention)
- ✅ Revocation (before cliff, after cliff, double revocation)
- ✅ Ownership transfer
- ✅ Unauthorized access prevention
- ✅ Edge cases (zero cliff, small amounts, cliff = duration)
- ✅ Token balance integrity

## 🌐 SCAI Network Configuration

| Property | Value |
|----------|-------|
| Network Name | SCAI Mainnet |
| RPC URL | `https://mainnet-rpc.scai.network` |
| Chain ID | 34 |
| Currency | SCAI |
| Explorer | `https://explorer.securechain.ai` |

## 📄 License

MIT License
