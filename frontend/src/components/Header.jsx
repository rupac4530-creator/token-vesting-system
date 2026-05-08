import { shortenAddress } from "../utils/helpers";
import { ACTIVE_NETWORK } from "../utils/constants";

export default function Header({ wallet }) {
  const { account, isConnected, isConnecting, isCorrectNetwork, hasMetaMask, connectWallet, disconnectWallet, switchNetwork } = wallet;

  return (
    <header className="header">
      <div className="header-inner">
        <div className="logo">
          <div className="logo-icon">⏳</div>
          <div>
            <h1 className="logo-title">TokenVest</h1>
            <p className="logo-subtitle">Token Vesting System</p>
          </div>
        </div>

        <div className="header-right">
          {isConnected && !isCorrectNetwork && (
            <button className="btn btn-warning" onClick={switchNetwork}>
              ⚠️ Switch to {ACTIVE_NETWORK.name}
            </button>
          )}

          {isConnected && isCorrectNetwork && (
            <div className="network-badge">
              <span className="network-dot"></span>
              {ACTIVE_NETWORK.name}
            </div>
          )}

          {!isConnected ? (
            <button
              className="btn btn-primary"
              onClick={connectWallet}
              disabled={isConnecting || !hasMetaMask}
            >
              {!hasMetaMask ? "Install MetaMask" : isConnecting ? "Connecting..." : "🦊 Connect Wallet"}
            </button>
          ) : (
            <div className="wallet-info">
              <span className="wallet-address">{shortenAddress(account)}</span>
              <button className="btn btn-outline btn-sm" onClick={disconnectWallet}>
                Disconnect
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
