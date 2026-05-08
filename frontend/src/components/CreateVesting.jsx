import { useState } from "react";
import { ethers } from "ethers";
import { TIME_UNITS } from "../utils/constants";

export default function CreateVesting({ onCreateSchedule, tokenBalance }) {
  const [beneficiary, setBeneficiary] = useState("");
  const [amount, setAmount] = useState("");
  const [cliffMonths, setCliffMonths] = useState("3");
  const [vestingMonths, setVestingMonths] = useState("12");
  const [startNow, setStartNow] = useState(true);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!beneficiary || !amount || !cliffMonths || !vestingMonths) return;

    if (!ethers.isAddress(beneficiary)) {
      alert("Invalid beneficiary address");
      return;
    }

    const cliffSeconds = parseInt(cliffMonths) * TIME_UNITS.MONTH;
    const vestingSeconds = parseInt(vestingMonths) * TIME_UNITS.MONTH;

    if (cliffSeconds > vestingSeconds) {
      alert("Cliff period cannot exceed vesting duration");
      return;
    }

    onCreateSchedule(
      beneficiary,
      amount,
      startNow ? 0 : Math.floor(Date.now() / 1000) + TIME_UNITS.DAY,
      cliffSeconds,
      vestingSeconds
    );
  };

  return (
    <div className="create-vesting">
      <h3 className="section-title">➕ Create Vesting Schedule</h3>
      <form onSubmit={handleSubmit} className="create-form">
        <div className="form-group">
          <label>Beneficiary Address</label>
          <input
            type="text"
            placeholder="0x..."
            value={beneficiary}
            onChange={(e) => setBeneficiary(e.target.value)}
            className="form-input"
            required
          />
        </div>

        <div className="form-group">
          <label>Token Amount (VEST)</label>
          <input
            type="number"
            placeholder="10000"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="form-input"
            min="0"
            step="any"
            required
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Cliff Period (months)</label>
            <input
              type="number"
              value={cliffMonths}
              onChange={(e) => setCliffMonths(e.target.value)}
              className="form-input"
              min="0"
              required
            />
          </div>
          <div className="form-group">
            <label>Vesting Duration (months)</label>
            <input
              type="number"
              value={vestingMonths}
              onChange={(e) => setVestingMonths(e.target.value)}
              className="form-input"
              min="1"
              required
            />
          </div>
        </div>

        <div className="form-group checkbox-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={startNow}
              onChange={(e) => setStartNow(e.target.checked)}
            />
            Start immediately
          </label>
        </div>

        <button type="submit" className="btn btn-primary btn-lg full-width">
          Create Vesting Schedule
        </button>
      </form>
    </div>
  );
}
