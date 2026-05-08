import { ethers } from "ethers";

/**
 * Shortens an Ethereum address for display
 */
export function shortenAddress(address) {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * Formats a token amount from wei to human readable
 */
export function formatTokenAmount(amount, decimals = 18) {
  if (!amount) return "0";
  try {
    return parseFloat(ethers.formatUnits(amount, decimals)).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 4,
    });
  } catch {
    return "0";
  }
}

/**
 * Converts human readable amount to wei
 */
export function parseTokenAmount(amount, decimals = 18) {
  try {
    return ethers.parseUnits(amount.toString(), decimals);
  } catch {
    return 0n;
  }
}

/**
 * Formats a unix timestamp to readable date
 */
export function formatDate(timestamp) {
  if (!timestamp) return "N/A";
  const ts = typeof timestamp === "bigint" ? Number(timestamp) : timestamp;
  return new Date(ts * 1000).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Formats duration in seconds to human readable
 */
export function formatDuration(seconds) {
  const s = typeof seconds === "bigint" ? Number(seconds) : seconds;
  if (s < 60) return `${s} seconds`;
  if (s < 3600) return `${Math.floor(s / 60)} minutes`;
  if (s < 86400) return `${Math.floor(s / 3600)} hours`;
  if (s < 2592000) return `${Math.floor(s / 86400)} days`;
  if (s < 31536000) return `${Math.floor(s / 2592000)} months`;
  return `${(s / 31536000).toFixed(1)} years`;
}

/**
 * Calculates vesting progress percentage
 */
export function calculateProgress(schedule) {
  if (!schedule) return 0;
  const now = Math.floor(Date.now() / 1000);
  const start = Number(schedule.startTime);
  const duration = Number(schedule.vestingDuration);
  const cliff = Number(schedule.cliffDuration);

  if (now < start) return 0;
  const elapsed = now - start;
  if (elapsed < cliff) return 0;
  if (elapsed >= duration) return 100;
  return Math.min(100, Math.floor((elapsed / duration) * 100));
}

/**
 * Gets the vesting status label
 */
export function getVestingStatus(schedule) {
  if (!schedule) return "Unknown";
  if (schedule.revoked) return "Revoked";

  const now = Math.floor(Date.now() / 1000);
  const start = Number(schedule.startTime);
  const duration = Number(schedule.vestingDuration);
  const cliff = Number(schedule.cliffDuration);

  if (now < start) return "Not Started";
  if (now - start < cliff) return "Cliff Period";
  if (now - start >= duration) return "Fully Vested";
  return "Vesting";
}

/**
 * Returns a color for the status
 */
export function getStatusColor(status) {
  switch (status) {
    case "Fully Vested": return "#00d4aa";
    case "Vesting": return "#7c5cfc";
    case "Cliff Period": return "#f0a030";
    case "Not Started": return "#888";
    case "Revoked": return "#ff4466";
    default: return "#888";
  }
}
