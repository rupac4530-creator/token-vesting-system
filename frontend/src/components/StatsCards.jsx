import { formatTokenAmount } from "../utils/helpers";

export default function StatsCards({ schedules, scheduleCount }) {
  const totalLocked = schedules.reduce((sum, s) => sum + s.totalAmount, 0n);
  const totalClaimed = schedules.reduce((sum, s) => sum + s.amountClaimed, 0n);
  const totalClaimable = schedules.reduce((sum, s) => sum + s.claimable, 0n);
  const activeCount = schedules.filter((s) => !s.revoked).length;

  return (
    <div className="stats-grid">
      <div className="stat-card">
        <div className="stat-icon">🔒</div>
        <div className="stat-info">
          <p className="stat-label">Total Locked</p>
          <p className="stat-value">{formatTokenAmount(totalLocked)}</p>
          <p className="stat-sub">VEST tokens</p>
        </div>
      </div>
      <div className="stat-card">
        <div className="stat-icon">✅</div>
        <div className="stat-info">
          <p className="stat-label">Total Claimed</p>
          <p className="stat-value">{formatTokenAmount(totalClaimed)}</p>
          <p className="stat-sub">VEST tokens</p>
        </div>
      </div>
      <div className="stat-card">
        <div className="stat-icon">💰</div>
        <div className="stat-info">
          <p className="stat-label">Claimable Now</p>
          <p className="stat-value claimable">{formatTokenAmount(totalClaimable)}</p>
          <p className="stat-sub">VEST tokens</p>
        </div>
      </div>
      <div className="stat-card">
        <div className="stat-icon">📋</div>
        <div className="stat-info">
          <p className="stat-label">Schedules</p>
          <p className="stat-value">{activeCount} / {scheduleCount}</p>
          <p className="stat-sub">active / total</p>
        </div>
      </div>
    </div>
  );
}
