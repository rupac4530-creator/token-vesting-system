# Token Vesting System — Requirements & Use Cases

## 1. What is Token Vesting?

Token vesting is a mechanism that **locks tokens** in a smart contract and **releases them gradually over time** according to a predefined schedule. It prevents beneficiaries from accessing all tokens immediately, ensuring long-term commitment and alignment of interests.

### Key Concepts

| Term | Definition |
|------|-----------|
| **Vesting Schedule** | The rules defining how tokens are released over time |
| **Cliff Period** | Initial lock period where no tokens are released |
| **Vesting Duration** | Total time over which all tokens become available |
| **Beneficiary** | The address entitled to receive vested tokens |
| **Linear Vesting** | Tokens release proportionally over time after the cliff |
| **Revocable** | Whether the vesting creator can cancel unvested tokens |

### Example

> **1,000 tokens** → **3-month cliff** → **12-month total vesting**
>
> - Month 0–3: 0 tokens available (cliff period)
> - Month 3: 250 tokens available (25% at cliff end)
> - Month 6: 500 tokens available (50%)
> - Month 12: 1,000 tokens available (100% fully vested)

---

## 2. Why Token Vesting Matters

### Problems it Solves

1. **Token Dumping Prevention**: Without vesting, founders/investors could sell all tokens immediately, crashing the price
2. **Long-term Alignment**: Ensures stakeholders remain committed to the project's success
3. **Investor Confidence**: Shows the market that insiders can't exit quickly
4. **Regulatory Compliance**: Helps satisfy lockup requirements in many jurisdictions
5. **Fair Distribution**: Prevents concentration of liquid tokens

### Real-World Usage

- **Startup Token Allocations**: Founder tokens locked for 2–4 years
- **Employee Compensation**: Token grants with 1-year cliff and 4-year vesting
- **Seed/Private Sale**: Investor tokens with 6-month cliff, 18-month linear release
- **Advisor Allocations**: Shorter vesting with cliff
- **Ecosystem/Community Funds**: Gradual release for development funding

---

## 3. Target Users

| User Role | Actions | Permissions |
|-----------|---------|-------------|
| **Admin/Owner** | Create schedules, revoke vesting, deposit tokens | Full control |
| **Beneficiary** | View schedule, claim vested tokens | Claim only |
| **Viewer** | View public vesting information | Read-only |

---

## 4. Core Features

### Must Have (MVP)

- [x] Create vesting schedules with cliff + linear release
- [x] Lock ERC20 tokens in the contract
- [x] Allow beneficiaries to claim vested tokens
- [x] Prevent claiming before cliff
- [x] Prevent double claiming
- [x] View vesting schedule details
- [x] View claimable amount
- [x] Revoke unvested tokens (admin)
- [x] Event emissions for all actions

### Should Have

- [x] Multiple vesting schedules per beneficiary
- [x] Visual progress bar for vesting status
- [x] Wallet connection (MetaMask)
- [x] Network auto-detection (SCAI)
- [x] Transaction status feedback

### Nice to Have

- [ ] Multiple token support in single contract
- [ ] Batch schedule creation
- [ ] Schedule transfer to new beneficiary
- [ ] Vesting schedule templates

---

## 5. Use Cases

### Use Case 1: Founder Token Lockup

**Actor**: Project Admin
**Scenario**: Lock 1,000,000 tokens for the founding team with a 6-month cliff and 24-month total vesting.
**Flow**:
1. Admin connects wallet
2. Admin creates vesting schedule for founder address
3. Sets cliff = 6 months, duration = 24 months
4. Deposits 1,000,000 tokens
5. Contract locks tokens
6. After 6 months, founder can start claiming

### Use Case 2: Investor Token Distribution

**Actor**: Project Admin
**Scenario**: Distribute tokens from a seed round with 3-month cliff, 12-month vesting.
**Flow**:
1. Admin creates schedule for each investor
2. Each investor connects wallet to DApp
3. Investors view their vesting progress
4. After cliff, investors claim proportionally

### Use Case 3: Employee Token Grant

**Actor**: HR/Admin
**Scenario**: Grant 10,000 tokens to an employee with 1-year cliff, 4-year vesting.
**Flow**:
1. Admin creates schedule
2. Employee sees schedule in dashboard
3. After 1 year, 25% becomes claimable
4. Rest releases linearly over remaining 3 years

### Use Case 4: Emergency Revocation

**Actor**: Project Admin
**Scenario**: Employee leaves the company, admin revokes unvested tokens.
**Flow**:
1. Admin calls revoke on the schedule
2. Unvested tokens return to admin
3. Already vested (but unclaimed) tokens remain claimable by beneficiary

---

## 6. Non-Functional Requirements

| Requirement | Detail |
|------------|--------|
| **Security** | ReentrancyGuard, access control, safe math |
| **Gas Efficiency** | Optimized storage layout, minimal writes |
| **Compatibility** | EVM-compatible (SCAI network) |
| **Frontend** | Responsive, works on desktop and mobile |
| **Documentation** | Full README, inline comments, architecture docs |
