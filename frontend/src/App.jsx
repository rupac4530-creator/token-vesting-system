import { useWallet } from "./hooks/useWallet";
import { useContract } from "./hooks/useContract";
import Header from "./components/Header";
import HeroSection from "./components/HeroSection";
import StatsCards from "./components/StatsCards";
import VestingScheduleCard from "./components/VestingScheduleCard";
import CreateVesting from "./components/CreateVesting";
import TransactionStatus from "./components/TransactionStatus";
import Footer from "./components/Footer";
import { CONTRACT_ADDRESSES } from "./utils/constants";
import "./App.css";

function App() {
  const wallet = useWallet();
  const contract = useContract(wallet.signer, wallet.provider, wallet.account);

  const contractsConfigured = CONTRACT_ADDRESSES.TokenVesting && CONTRACT_ADDRESSES.VestToken;

  return (
    <div className="app">
      <Header wallet={wallet} />

      <TransactionStatus txStatus={contract.txStatus} onClear={contract.clearTxStatus} />

      <main className="main">
        {!wallet.isConnected ? (
          <HeroSection onConnect={wallet.connectWallet} hasMetaMask={wallet.hasMetaMask} />
        ) : !wallet.isCorrectNetwork ? (
          <section className="notice-section">
            <div className="notice-card warning">
              <h3>⚠️ Wrong Network</h3>
              <p>Please switch to the correct network to use this DApp.</p>
              <button className="btn btn-primary" onClick={wallet.switchNetwork}>
                Switch Network
              </button>
            </div>
          </section>
        ) : !contractsConfigured ? (
          <section className="notice-section">
            <div className="notice-card info">
              <h3>📋 Contracts Not Deployed</h3>
              <p>The smart contracts have not been deployed yet. Please deploy the contracts first and update the contract addresses in the configuration.</p>
              <div className="code-block">
                <code>frontend/src/utils/constants.js</code>
              </div>
              <p className="notice-sub">Run <code>npx hardhat run scripts/deploy.js --network scai</code> to deploy.</p>
            </div>
          </section>
        ) : (
          <div className="dashboard">
            {wallet.error && (
              <div className="notice-card error">
                <p>{wallet.error}</p>
              </div>
            )}

            <StatsCards schedules={contract.schedules} scheduleCount={contract.scheduleCount} />

            {contract.isOwner && (
              <CreateVesting
                onCreateSchedule={contract.createSchedule}
                tokenBalance={0}
              />
            )}

            <section className="schedules-section">
              <h3 className="section-title">
                {contract.isOwner ? "📋 All Vesting Schedules" : "📋 Your Vesting Schedules"}
              </h3>

              {contract.loading ? (
                <div className="loading-state">
                  <div className="spinner"></div>
                  <p>Loading schedules...</p>
                </div>
              ) : contract.schedules.length === 0 ? (
                <div className="empty-state">
                  <p className="empty-icon">📭</p>
                  <p>No vesting schedules found for your address.</p>
                </div>
              ) : (
                <div className="schedules-grid">
                  {contract.schedules.map((schedule) => (
                    <VestingScheduleCard
                      key={schedule.id}
                      schedule={schedule}
                      onClaim={contract.claimTokens}
                      onRevoke={contract.revokeSchedule}
                      isOwner={contract.isOwner}
                    />
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

export default App;
