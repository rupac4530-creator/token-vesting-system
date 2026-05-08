# Token Vesting System — Design Decisions

## Decision Log

### D1: Token Standard — ERC20
**Date**: 2025-01-01
**Decision**: Use standard ERC20 tokens for vesting
**Rationale**: ERC20 is the most widely supported token standard. The vesting contract should work with any ERC20 token.
**Alternatives Considered**: ERC721 (NFT), ERC1155 — rejected because vesting is about fungible value.

### D2: Vesting Model — Linear with Cliff
**Date**: 2025-01-01
**Decision**: Implement linear vesting with optional cliff period
**Rationale**: This is the most common vesting model used by real projects. Simple to understand, implement, and audit.
**Alternatives Considered**: Step vesting (monthly unlocks), custom curves — too complex for MVP.

### D3: Contract Framework — Hardhat
**Date**: 2025-01-01
**Decision**: Use Hardhat for development, testing, and deployment
**Rationale**: Most popular Solidity framework, extensive plugin ecosystem, excellent testing support.
**Alternatives Considered**: Foundry — faster but less beginner-friendly.

### D4: Frontend Framework — React + Vite
**Date**: 2025-01-01
**Decision**: Use React with Vite for the frontend
**Rationale**: Fast build times, modern tooling, widely known.
**Alternatives Considered**: Next.js — too heavyweight for a single-page DApp.

### D5: Web3 Library — ethers.js v6
**Date**: 2025-01-01
**Decision**: Use ethers.js v6 for blockchain interactions
**Rationale**: Clean API, TypeScript support, smaller bundle than web3.js.
**Alternatives Considered**: web3.js, viem — ethers.js is the most widely documented.

### D6: Network — SCAI Mainnet
**Date**: 2025-01-01
**Decision**: Deploy to SCAI Mainnet (Chain ID: 34) as required by the project
**Rationale**: Project requirement for internship submission.

### D7: Revocability
**Date**: 2025-01-01
**Decision**: Vesting schedules are revocable by the contract owner
**Rationale**: Real-world vesting contracts need admin control for cases like employee departure. Already-vested tokens remain claimable.

### D8: Single Contract Design
**Date**: 2025-01-01
**Decision**: Use a single TokenVesting contract that manages all schedules
**Rationale**: Simpler deployment, easier to manage, lower gas for creation. Each schedule is identified by an incremental ID.
**Alternatives Considered**: Factory pattern (deploy new contract per schedule) — higher gas, more complex.
