import { ACTIVE_NETWORK } from "../utils/constants";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <p className="footer-text">
          Token Vesting System — Built on {ACTIVE_NETWORK.name}
        </p>
        <div className="footer-links">
          <a href={ACTIVE_NETWORK.explorer} target="_blank" rel="noopener noreferrer">
            Block Explorer ↗
          </a>
          <a href="https://github.com" target="_blank" rel="noopener noreferrer">
            GitHub ↗
          </a>
        </div>
      </div>
    </footer>
  );
}
