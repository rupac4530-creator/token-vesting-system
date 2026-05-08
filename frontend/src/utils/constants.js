// SCAI Mainnet Configuration
export const SCAI_MAINNET = {
  chainId: 34,
  chainIdHex: "0x22",
  name: "SCAI Mainnet",
  rpcUrl: "https://mainnet-rpc.scai.network",
  explorer: "https://explorer.securechain.ai",
  currency: {
    name: "SCAI",
    symbol: "SCAI",
    decimals: 18,
  },
};

// SCAI Testnet Configuration
export const SCAI_TESTNET = {
  chainId: 3434,
  chainIdHex: "0xD6A",
  name: "SecureChain Testnet",
  rpcUrl: "https://testnet-rpc.securechain.ai",
  explorer: "https://testnet-explorer.securechain.ai",
  currency: {
    name: "SCAI",
    symbol: "SCAI",
    decimals: 18,
  },
};

// Active network (change this for deployment)
export const ACTIVE_NETWORK = SCAI_MAINNET;

// Contract addresses — UPDATE AFTER DEPLOYMENT
export const CONTRACT_ADDRESSES = {
  TokenVesting: "",
  VestToken: "",
};

// Time constants for UI
export const TIME_UNITS = {
  MINUTE: 60,
  HOUR: 3600,
  DAY: 86400,
  WEEK: 604800,
  MONTH: 2592000,
  YEAR: 31536000,
};
