import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import { CONTRACT_ADDRESSES } from "../utils/constants";
import TokenVestingABI from "../abi/TokenVesting.json";
import VestTokenABI from "../abi/VestToken.json";

/**
 * Custom hook for interacting with the TokenVesting and VestToken contracts.
 */
export function useContract(signer, provider, account) {
  const [vestingContract, setVestingContract] = useState(null);
  const [tokenContract, setTokenContract] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [scheduleCount, setScheduleCount] = useState(0);
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(false);
  const [txStatus, setTxStatus] = useState(null);

  // Initialize contracts
  useEffect(() => {
    if (!signer || !CONTRACT_ADDRESSES.TokenVesting || !CONTRACT_ADDRESSES.VestToken) return;

    try {
      const vesting = new ethers.Contract(
        CONTRACT_ADDRESSES.TokenVesting,
        TokenVestingABI.abi,
        signer
      );
      const token = new ethers.Contract(
        CONTRACT_ADDRESSES.VestToken,
        VestTokenABI.abi,
        signer
      );
      setVestingContract(vesting);
      setTokenContract(token);
    } catch (err) {
      console.error("Failed to initialize contracts:", err);
    }
  }, [signer]);

  // Check if connected account is owner
  useEffect(() => {
    if (!vestingContract || !account) return;
    vestingContract.owner().then((owner) => {
      setIsOwner(owner.toLowerCase() === account.toLowerCase());
    }).catch(() => setIsOwner(false));
  }, [vestingContract, account]);

  // Load all schedules for connected account
  const loadSchedules = useCallback(async () => {
    if (!vestingContract || !account) return;
    setLoading(true);
    try {
      const count = await vestingContract.getScheduleCount();
      setScheduleCount(Number(count));

      const ids = await vestingContract.getSchedulesByBeneficiary(account);
      const loaded = [];

      for (const id of ids) {
        const schedule = await vestingContract.getVestingSchedule(id);
        const claimable = await vestingContract.getClaimableAmount(id);
        const vested = await vestingContract.computeVestedAmount(id);
        loaded.push({
          id: Number(id),
          beneficiary: schedule.beneficiary,
          token: schedule.token,
          totalAmount: schedule.totalAmount,
          startTime: schedule.startTime,
          cliffDuration: schedule.cliffDuration,
          vestingDuration: schedule.vestingDuration,
          amountClaimed: schedule.amountClaimed,
          revoked: schedule.revoked,
          claimable,
          vested,
        });
      }

      setSchedules(loaded);
    } catch (err) {
      console.error("Failed to load schedules:", err);
    } finally {
      setLoading(false);
    }
  }, [vestingContract, account]);

  // Load all schedules (admin view)
  const loadAllSchedules = useCallback(async () => {
    if (!vestingContract) return;
    setLoading(true);
    try {
      const count = await vestingContract.getScheduleCount();
      setScheduleCount(Number(count));
      const loaded = [];

      for (let i = 0; i < Number(count); i++) {
        try {
          const schedule = await vestingContract.getVestingSchedule(i);
          const claimable = await vestingContract.getClaimableAmount(i);
          const vested = await vestingContract.computeVestedAmount(i);
          loaded.push({
            id: i,
            beneficiary: schedule.beneficiary,
            token: schedule.token,
            totalAmount: schedule.totalAmount,
            startTime: schedule.startTime,
            cliffDuration: schedule.cliffDuration,
            vestingDuration: schedule.vestingDuration,
            amountClaimed: schedule.amountClaimed,
            revoked: schedule.revoked,
            claimable,
            vested,
          });
        } catch { /* skip invalid */ }
      }
      setSchedules(loaded);
    } catch (err) {
      console.error("Failed to load all schedules:", err);
    } finally {
      setLoading(false);
    }
  }, [vestingContract]);

  useEffect(() => {
    if (vestingContract && account) {
      if (isOwner) {
        loadAllSchedules();
      } else {
        loadSchedules();
      }
    }
  }, [vestingContract, account, isOwner, loadSchedules, loadAllSchedules]);

  // Create vesting schedule (admin only)
  const createSchedule = useCallback(async (beneficiary, amount, startTime, cliffDuration, vestingDuration) => {
    if (!vestingContract || !tokenContract) return;
    setTxStatus({ type: "pending", message: "Approving tokens..." });

    try {
      const parsedAmount = ethers.parseEther(amount.toString());

      // Approve tokens first
      const approveTx = await tokenContract.approve(
        CONTRACT_ADDRESSES.TokenVesting,
        parsedAmount
      );
      await approveTx.wait();
      setTxStatus({ type: "pending", message: "Creating vesting schedule..." });

      // Create schedule
      const createTx = await vestingContract.createVestingSchedule(
        beneficiary,
        CONTRACT_ADDRESSES.VestToken,
        parsedAmount,
        startTime || 0,
        cliffDuration,
        vestingDuration
      );
      const receipt = await createTx.wait();
      setTxStatus({ type: "success", message: "Vesting schedule created!", hash: receipt.hash });

      // Reload schedules
      if (isOwner) await loadAllSchedules(); else await loadSchedules();
    } catch (err) {
      setTxStatus({ type: "error", message: err.reason || err.message || "Transaction failed" });
    }
  }, [vestingContract, tokenContract, isOwner, loadSchedules, loadAllSchedules]);

  // Claim vested tokens
  const claimTokens = useCallback(async (scheduleId) => {
    if (!vestingContract) return;
    setTxStatus({ type: "pending", message: "Claiming tokens..." });

    try {
      const tx = await vestingContract.claimVestedTokens(scheduleId);
      const receipt = await tx.wait();
      setTxStatus({ type: "success", message: "Tokens claimed successfully!", hash: receipt.hash });

      if (isOwner) await loadAllSchedules(); else await loadSchedules();
    } catch (err) {
      setTxStatus({ type: "error", message: err.reason || err.message || "Claim failed" });
    }
  }, [vestingContract, isOwner, loadSchedules, loadAllSchedules]);

  // Revoke vesting (admin only)
  const revokeSchedule = useCallback(async (scheduleId) => {
    if (!vestingContract) return;
    setTxStatus({ type: "pending", message: "Revoking vesting..." });

    try {
      const tx = await vestingContract.revokeVesting(scheduleId);
      const receipt = await tx.wait();
      setTxStatus({ type: "success", message: "Vesting revoked!", hash: receipt.hash });
      await loadAllSchedules();
    } catch (err) {
      setTxStatus({ type: "error", message: err.reason || err.message || "Revoke failed" });
    }
  }, [vestingContract, loadAllSchedules]);

  // Get token balance
  const getTokenBalance = useCallback(async () => {
    if (!tokenContract || !account) return 0n;
    try {
      return await tokenContract.balanceOf(account);
    } catch {
      return 0n;
    }
  }, [tokenContract, account]);

  const clearTxStatus = useCallback(() => setTxStatus(null), []);

  return {
    vestingContract,
    tokenContract,
    schedules,
    scheduleCount,
    isOwner,
    loading,
    txStatus,
    createSchedule,
    claimTokens,
    revokeSchedule,
    getTokenBalance,
    loadSchedules,
    loadAllSchedules,
    clearTxStatus,
  };
}
