import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import { ACTIVE_NETWORK } from "../utils/constants";

/**
 * Custom hook for wallet connection management.
 * Handles MetaMask connect/disconnect, network switching, and account changes.
 */
export function useWallet() {
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);

  const isConnected = !!account;
  const isCorrectNetwork = chainId === ACTIVE_NETWORK.chainId;

  // Check if MetaMask is installed
  const hasMetaMask = typeof window !== "undefined" && !!window.ethereum;

  // Switch to the correct network
  const switchNetwork = useCallback(async () => {
    if (!window.ethereum) return;
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: ACTIVE_NETWORK.chainIdHex }],
      });
    } catch (switchError) {
      // Chain not added, try adding it
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [{
              chainId: ACTIVE_NETWORK.chainIdHex,
              chainName: ACTIVE_NETWORK.name,
              rpcUrls: [ACTIVE_NETWORK.rpcUrl],
              blockExplorerUrls: [ACTIVE_NETWORK.explorer],
              nativeCurrency: ACTIVE_NETWORK.currency,
            }],
          });
        } catch (addError) {
          setError("Failed to add network: " + addError.message);
        }
      } else {
        setError("Failed to switch network: " + switchError.message);
      }
    }
  }, []);

  // Connect wallet
  const connectWallet = useCallback(async () => {
    if (!hasMetaMask) {
      setError("MetaMask is not installed. Please install it from metamask.io");
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      const browserProvider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await browserProvider.send("eth_requestAccounts", []);

      if (accounts.length > 0) {
        const walletSigner = await browserProvider.getSigner();
        const network = await browserProvider.getNetwork();

        setAccount(accounts[0]);
        setProvider(browserProvider);
        setSigner(walletSigner);
        setChainId(Number(network.chainId));
      }
    } catch (err) {
      if (err.code === 4001) {
        setError("Connection rejected by user");
      } else {
        setError("Failed to connect: " + err.message);
      }
    } finally {
      setIsConnecting(false);
    }
  }, [hasMetaMask]);

  // Disconnect wallet
  const disconnectWallet = useCallback(() => {
    setAccount(null);
    setProvider(null);
    setSigner(null);
    setChainId(null);
    setError(null);
  }, []);

  // Listen for account and chain changes
  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = (accounts) => {
      if (accounts.length === 0) {
        disconnectWallet();
      } else {
        setAccount(accounts[0]);
        // Refresh provider/signer
        const p = new ethers.BrowserProvider(window.ethereum);
        setProvider(p);
        p.getSigner().then(setSigner);
      }
    };

    const handleChainChanged = (newChainId) => {
      setChainId(parseInt(newChainId, 16));
      // Refresh provider/signer
      const p = new ethers.BrowserProvider(window.ethereum);
      setProvider(p);
      p.getSigner().then(setSigner);
    };

    window.ethereum.on("accountsChanged", handleAccountsChanged);
    window.ethereum.on("chainChanged", handleChainChanged);

    return () => {
      window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
      window.ethereum.removeListener("chainChanged", handleChainChanged);
    };
  }, [disconnectWallet]);

  // Auto-connect if previously connected
  useEffect(() => {
    if (!window.ethereum) return;
    window.ethereum.request({ method: "eth_accounts" }).then((accounts) => {
      if (accounts.length > 0) {
        connectWallet();
      }
    });
  }, [connectWallet]);

  return {
    account,
    provider,
    signer,
    chainId,
    isConnected,
    isConnecting,
    isCorrectNetwork,
    hasMetaMask,
    error,
    connectWallet,
    disconnectWallet,
    switchNetwork,
  };
}
