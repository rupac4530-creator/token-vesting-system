const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("Security & Edge-Case Tests", function () {
  let vestToken, tokenVesting, owner, beneficiary1, attacker;
  const ONE_DAY = 86400;
  const THREE_MONTHS = 90 * ONE_DAY;
  const ONE_YEAR = 365 * ONE_DAY;
  const VESTING_AMOUNT = ethers.parseEther("10000");
  const INITIAL_SUPPLY = ethers.parseEther("1000000");

  beforeEach(async function () {
    [owner, beneficiary1, attacker] = await ethers.getSigners();
    const VestToken = await ethers.getContractFactory("VestToken");
    vestToken = await VestToken.deploy("VestToken", "VEST", 1000000, 18);
    await vestToken.waitForDeployment();
    const TokenVesting = await ethers.getContractFactory("TokenVesting");
    tokenVesting = await TokenVesting.deploy();
    await tokenVesting.waitForDeployment();
    await vestToken.approve(await tokenVesting.getAddress(), INITIAL_SUPPLY);
  });

  describe("Unauthorized Access", function () {
    it("should prevent non-owner from creating schedules", async function () {
      await expect(tokenVesting.connect(attacker).createVestingSchedule(
        beneficiary1.address, await vestToken.getAddress(),
        VESTING_AMOUNT, 0, THREE_MONTHS, ONE_YEAR
      )).to.be.revertedWith("TokenVesting: caller is not the owner");
    });
    it("should prevent non-owner from revoking", async function () {
      await tokenVesting.createVestingSchedule(
        beneficiary1.address, await vestToken.getAddress(),
        VESTING_AMOUNT, 0, THREE_MONTHS, ONE_YEAR
      );
      await expect(tokenVesting.connect(attacker).revokeVesting(0))
        .to.be.revertedWith("TokenVesting: caller is not the owner");
    });
    it("should prevent wrong beneficiary from claiming", async function () {
      await tokenVesting.createVestingSchedule(
        beneficiary1.address, await vestToken.getAddress(),
        VESTING_AMOUNT, 0, THREE_MONTHS, ONE_YEAR
      );
      await time.increase(ONE_YEAR);
      await expect(tokenVesting.connect(attacker).claimVestedTokens(0))
        .to.be.revertedWith("TokenVesting: caller is not the beneficiary");
    });
  });

  describe("Edge Cases", function () {
    it("should handle zero cliff", async function () {
      await tokenVesting.createVestingSchedule(
        beneficiary1.address, await vestToken.getAddress(),
        VESTING_AMOUNT, 0, 0, ONE_YEAR
      );
      await time.increase(ONE_DAY);
      expect(await tokenVesting.computeVestedAmount(0)).to.be.gt(0);
    });
    it("should handle small amounts", async function () {
      await tokenVesting.createVestingSchedule(
        beneficiary1.address, await vestToken.getAddress(),
        1, 0, 0, ONE_YEAR
      );
      await time.increase(ONE_YEAR + ONE_DAY);
      await tokenVesting.connect(beneficiary1).claimVestedTokens(0);
      expect(await vestToken.balanceOf(beneficiary1.address)).to.equal(1);
    });
    it("should handle cliff equal to duration", async function () {
      await tokenVesting.createVestingSchedule(
        beneficiary1.address, await vestToken.getAddress(),
        VESTING_AMOUNT, 0, ONE_YEAR, ONE_YEAR
      );
      await time.increase(ONE_YEAR - ONE_DAY);
      expect(await tokenVesting.computeVestedAmount(0)).to.equal(0);
      await time.increase(2 * ONE_DAY);
      expect(await tokenVesting.computeVestedAmount(0)).to.equal(VESTING_AMOUNT);
    });
    it("should reject non-existent schedule", async function () {
      await expect(tokenVesting.connect(beneficiary1).claimVestedTokens(99))
        .to.be.revertedWith("TokenVesting: schedule does not exist");
    });
  });

  describe("Token Balance Integrity", function () {
    it("should track locked tokens correctly", async function () {
      await tokenVesting.createVestingSchedule(
        beneficiary1.address, await vestToken.getAddress(),
        VESTING_AMOUNT, 0, THREE_MONTHS, ONE_YEAR
      );
      expect(await tokenVesting.totalLockedTokens(await vestToken.getAddress())).to.equal(VESTING_AMOUNT);
      await time.increase(ONE_YEAR + ONE_DAY);
      await tokenVesting.connect(beneficiary1).claimVestedTokens(0);
      expect(await tokenVesting.totalLockedTokens(await vestToken.getAddress())).to.equal(0);
    });
    it("should prevent overclaiming", async function () {
      await tokenVesting.createVestingSchedule(
        beneficiary1.address, await vestToken.getAddress(),
        VESTING_AMOUNT, 0, THREE_MONTHS, ONE_YEAR
      );
      await time.increase(ONE_YEAR + ONE_DAY);
      await tokenVesting.connect(beneficiary1).claimVestedTokens(0);
      await expect(tokenVesting.connect(beneficiary1).claimVestedTokens(0))
        .to.be.revertedWith("TokenVesting: no tokens available to claim");
    });
  });
});
