import { formatTokenAmount, formatDate, formatDuration, calculateProgress, getVestingStatus, getStatusColor, shortenAddress } from "../utils/helpers";

export default function VestingScheduleCard({ schedule, onClaim, onRevoke, isOwner }) {
  const progress = calculateProgress(schedule);
  const status = getVestingStatus(schedule);
  const statusColor = getStatusColor(status);
  const hasClaimable = schedule.claimable > 0n;

  return (
    <div className="schedule-card">
      <div className="schedule-header">
        <div className="schedule-id">Schedule #{schedule.id}</div>
        <span className="status-badge" style={{ backgroundColor: statusColor + "22", color: statusColor, borderColor: statusColor }}>
          {status}
        </span>
      </div>

      <div className="schedule-body">
        <div className="schedule-row">
          <span className="label">Beneficiary</span>
          <span className="value mono">{shortenAddress(schedule.beneficiary)}</span>
        </div>
        <div className="schedule-row">
          <span className="label">Total Amount</span>
          <span className="value">{formatTokenAmount(schedule.totalAmount)} VEST</span>
        </div>
        <div className="schedule-row">
          <span className="label">Vested</span>
          <span className="value">{formatTokenAmount(schedule.vested)} VEST</span>
        </div>
        <div className="schedule-row">
          <span className="label">Claimed</span>
          <span className="value">{formatTokenAmount(schedule.amountClaimed)} VEST</span>
        </div>
        <div className="schedule-row">
          <span className="label">Claimable Now</span>
          <span className="value claimable-amount">{formatTokenAmount(schedule.claimable)} VEST</span>
        </div>

        <div className="progress-section">
          <div className="progress-bar-bg">
            <div className="progress-bar-fill" style={{ width: `${progress}%`, backgroundColor: statusColor }}></div>
          </div>
          <div className="progress-label">{progress}% vested</div>
        </div>

        <div className="schedule-details">
          <div className="detail">
            <span className="detail-label">Start</span>
            <span className="detail-value">{formatDate(schedule.startTime)}</span>
          </div>
          <div className="detail">
            <span className="detail-label">Cliff</span>
            <span className="detail-value">{formatDuration(schedule.cliffDuration)}</span>
          </div>
          <div className="detail">
            <span className="detail-label">Duration</span>
            <span className="detail-value">{formatDuration(schedule.vestingDuration)}</span>
          </div>
        </div>
      </div>

      <div className="schedule-actions">
        {hasClaimable && !schedule.revoked && (
          <button className="btn btn-success" onClick={() => onClaim(schedule.id)}>
            💰 Claim {formatTokenAmount(schedule.claimable)} VEST
          </button>
        )}
        {isOwner && !schedule.revoked && status !== "Fully Vested" && (
          <button className="btn btn-danger btn-sm" onClick={() => onRevoke(schedule.id)}>
            Revoke
          </button>
        )}
      </div>
    </div>
  );
}
