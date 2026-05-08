export default function HeroSection({ onConnect, hasMetaMask }) {
  return (
    <section className="hero">
      <div className="hero-glow"></div>
      <div className="hero-content">
        <h2 className="hero-title">
          Token Vesting
          <span className="gradient-text"> Made Simple</span>
        </h2>
        <p className="hero-description">
          Lock ERC20 tokens with cliff periods and linear vesting schedules.
          Secure, transparent, and fully on-chain.
        </p>
        <div className="hero-features">
          <div className="feature-pill">⏱️ Cliff Periods</div>
          <div className="feature-pill">📈 Linear Vesting</div>
          <div className="feature-pill">🔒 Secure Claims</div>
          <div className="feature-pill">👁️ Full Transparency</div>
        </div>
        <button className="btn btn-primary btn-lg" onClick={onConnect} disabled={!hasMetaMask}>
          {hasMetaMask ? "🦊 Connect Wallet to Start" : "Please Install MetaMask"}
        </button>
      </div>
    </section>
  );
}
