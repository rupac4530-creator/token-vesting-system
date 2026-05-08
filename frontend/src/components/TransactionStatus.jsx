import { useEffect } from "react";
import { ACTIVE_NETWORK } from "../utils/constants";

export default function TransactionStatus({ txStatus, onClear }) {
  useEffect(() => {
    if (txStatus?.type === "success") {
      const timer = setTimeout(onClear, 8000);
      return () => clearTimeout(timer);
    }
  }, [txStatus, onClear]);

  if (!txStatus) return null;

  const icons = { pending: "⏳", success: "✅", error: "❌" };
  const classes = { pending: "tx-pending", success: "tx-success", error: "tx-error" };

  return (
    <div className={`tx-status ${classes[txStatus.type]}`}>
      <div className="tx-status-inner">
        <span className="tx-icon">{icons[txStatus.type]}</span>
        <span className="tx-message">{txStatus.message}</span>
        {txStatus.hash && (
          <a
            href={`${ACTIVE_NETWORK.explorer}/tx/${txStatus.hash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="tx-link"
          >
            View on Explorer ↗
          </a>
        )}
        {txStatus.type !== "pending" && (
          <button className="tx-close" onClick={onClear}>✕</button>
        )}
      </div>
      {txStatus.type === "pending" && <div className="tx-loading-bar"></div>}
    </div>
  );
}
