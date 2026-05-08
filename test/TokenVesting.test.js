const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("TokenVesting", function () {
  let vestToken, tokenVesting, owner, beneficiary1, beneficiary2, unauthorized;
  const ONE_DAY = 86400;
  const ONE_MONTH = 30 * ONE_DAY;
  const THREE_MONTHS = 3 * ONE_MONTH;
  const SIX_MONTHS = 6 * ONE_MONTH;
  const ONE_YEAR = 365 * ONE_DAY;
  const INITIAL_SUPPLY = ethers.parseEther("1000000");
  const VESTING_AMOUNT = ethers.parseEther("10000");

  beforeEach(async function () {
    [owner, beneficiary1, beneficiary2, unauthorized] = await ethers.getSigners();
    const VestToken = await ethers.getContractFactory("VestToken");
    vestToken = await VestToken.deploy("VestToken", "VEST", 1000000, 18);
    await vestToken.waitForDeployment();
    const TokenVesting = await ethers.getContractFactory("TokenVesting");
    tokenVesting = await TokenVesting.deploy();
    await tokenVesting.waitForDeployment();
    await vestToken.approve(await tokenVesting.getAddress(), INITIAL_SUPPLY);
  });

  describe("Deployment", function () {
    it("should set deployer as owner", async function () {
      expect(await tokenVesting.owner()).to.equal(owner.address);
    });
    it("should initialize schedule count to 0", async function () {
      expect(await tokenVesting.getScheduleCount()).to.equal(0);
    });
    it("should mint initial supply to deployer", async function () {
      expect(await vestToken.balanceOf(owner.address)).to.equal(INITIAL_SUPPLY);
    });
  });

  describe("Create Vesting Schedule", function () {
    it("should create a schedule successfully", async function () {
      const startTime = (await time.latest()) + ONE_DAY;
      const tx = await tokenVesting.createVestingSchedule(
        beneficiary1.address, await vestToken.getAddress(),
        VESTING_AMOUNT, startTime, THREE_MONTHS, ONE_YEAR
      );
      await expect(tx).to.emit(tokenVesting, "VestingScheduleCreated");
      expect(await tokenVesting.getScheduleCount()).to.equal(1);
    });
    it("should use current timestamp if startTime is 0", async function () {
      await tokenVesting.createVestingSchedule(
        beneficiary1.address, await vestToken.getAddress(),
        VESTING_AMOUNT, 0, THREE_MONTHS, ONE_YEAR
      );
      const schedule = await tokenVesting.getVestingSchedule(0);
      expect(schedule.startTime).to.be.closeTo(await time.latest(), 5);
    });
    it("should transfer tokens to contract", async function () {
      await tokenVesting.createVestingSchedule(
        beneficiary1.address, await vestToken.getAddress(),
        VESTING_AMOUNT, 0, THREE_MONTHS, ONE_YEAR
      );
      expect(await vestToken.balanceOf(await tokenVesting.getAddress())).to.equal(VESTING_AMOUNT);
    });
    it("should revert for zero beneficiary", async function () {
      await expect(tokenVesting.createVestingSchedule(
        ethers.ZeroAddress, await vestToken.getAddress(),
        VESTING_AMOUNT, 0, THREE_MONTHS, ONE_YEAR
      )).to.be.revertedWith("TokenVesting: beneficiary is zero address");
    });
    it("should revert for zero amount", async function () {
      await expect(tokenVesting.createVestingSchedule(
        beneficiary1.address, await vestToken.getAddress(),
        0, 0, THREE_MONTHS, ONE_YEAR
      )).to.be.revertedWith("TokenVesting: amount must be > 0");
    });
    it("should revert if cliff > duration", async function () {
      await expect(tokenVesting.createVestingSchedule(
        beneficiary1.address, await vestToken.getAddress(),
        VESTING_AMOUNT, 0, ONE_YEAR, THREE_MONTHS
      )).to.be.revertedWith("TokenVesting: cliff > duration");
    });
    it("should revert if non-owner calls", async function () {
      await expect(tokenVesting.connect(unauthorized).createVestingSchedule(
        beneficiary1.address, await vestToken.getAddress(),
        VESTING_AMOUNT, 0, THREE_MONTHS, ONE_YEAR
      )).to.be.revertedWith("TokenVesting: caller is not the owner");
    });
  });

  describe("Vesting Computation", function () {
    beforeEach(async function () {
      await tokenVesting.createVestingSchedule(
        beneficiary1.address, await vestToken.getAddress(),
        VESTING_AMOUNT, 0, THREE_MONTHS, ONE_YEAR
      );
    });
    it("should return 0 before cliff", async function () {
      await time.increase(ONE_MONTH);
      expect(await tokenVesting.computeVestedAmount(0)).to.equal(0);
    });
    it("should vest proportionally after cliff", async function () {
      await time.increase(SIX_MONTHS);
      const vested = await tokenVesting.computeVestedAmount(0);
      const expected = VESTING_AMOUNT / 2n;
      expect(vested).to.be.closeTo(expected, ethers.parseEther("100"));
    });
    it("should vest 100% after full duration", async function () {
      await time.increase(ONE_YEAR + ONE_DAY);
      expect(await tokenVesting.computeVestedAmount(0)).to.equal(VESTING_AMOUNT);
    });
  });

  describe("Claim Vested Tokens", function () {
    beforeEach(async function () {
      await tokenVesting.createVestingSchedule(
        beneficiary1.address, await vestToken.getAddress(),
        VESTING_AMOUNT, 0, THREE_MONTHS, ONE_YEAR
      );
    });
    it("should revert claim before cliff", async function () {
      await time.increase(ONE_MONTH);
      await expect(tokenVesting.connect(beneficiary1).claimVestedTokens(0))
        .to.be.revertedWith("TokenVesting: no tokens available to claim");
    });
    it("should allow partial claim after cliff", async function () {
      await time.increase(SIX_MONTHS);
      await tokenVesting.connect(beneficiary1).claimVestedTokens(0);
      expect(await vestToken.balanceOf(beneficiary1.address)).to.be.gt(0);
    });
    it("should allow full claim after vesting ends", async function () {
      await time.increase(ONE_YEAR + ONE_DAY);
      await tokenVesting.connect(beneficiary1).claimVestedTokens(0);
      expect(await vestToken.balanceOf(beneficiary1.address)).to.equal(VESTING_AMOUNT);
    });
    it("should prevent double claim", async function () {
      await time.increase(ONE_YEAR + ONE_DAY);
      await tokenVesting.connect(beneficiary1).claimVestedTokens(0);
      await expect(tokenVesting.connect(beneficiary1).claimVestedTokens(0))
        .to.be.revertedWith("TokenVesting: no tokens available to claim");
    });
    it("should revert if caller is not beneficiary", async function () {
      await time.increase(SIX_MONTHS);
      await expect(tokenVesting.connect(unauthorized).claimVestedTokens(0))
        .to.be.revertedWith("TokenVesting: caller is not the beneficiary");
    });
  });

  describe("Revoke Vesting", function () {
    beforeEach(async function () {
      await tokenVesting.createVestingSchedule(
        beneficiary1.address, await vestToken.getAddress(),
        VESTING_AMOUNT, 0, THREE_MONTHS, ONE_YEAR
      );
    });
    it("should revoke and return unvested tokens", async function () {
      await time.increase(SIX_MONTHS);
      const before = await vestToken.balanceOf(owner.address);
      await tokenVesting.revokeVesting(0);
      const afterBal = await vestToken.balanceOf(owner.address);
      expect(afterBal).to.be.gt(before);
      expect((await tokenVesting.getVestingSchedule(0)).revoked).to.be.true;
    });
    it("should allow claim after revocation", async function () {
      await time.increase(SIX_MONTHS);
      await tokenVesting.revokeVesting(0);
      await tokenVesting.connect(beneficiary1).claimVestedTokens(0);
      expect(await vestToken.balanceOf(beneficiary1.address)).to.be.gt(0);
    });
    it("should revert double revocation", async function () {
      await tokenVesting.revokeVesting(0);
      await expect(tokenVesting.revokeVesting(0))
        .to.be.revertedWith("TokenVesting: schedule already revoked");
    });
    it("should return full amount if revoked before cliff", async function () {
      const before = await vestToken.balanceOf(owner.address);
      await tokenVesting.revokeVesting(0);
      const afterBal = await vestToken.balanceOf(owner.address);
      expect(afterBal - before).to.equal(VESTING_AMOUNT);
    });
  });

  describe("Ownership", function () {
    it("should transfer ownership", async function () {
      await tokenVesting.transferOwnership(beneficiary1.address);
      expect(await tokenVesting.owner()).to.equal(beneficiary1.address);
    });
    it("should revert transfer to zero address", async function () {
      await expect(tokenVesting.transferOwnership(ethers.ZeroAddress))
        .to.be.revertedWith("TokenVesting: new owner is zero address");
    });
  });
});
