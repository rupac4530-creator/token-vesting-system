// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title TokenVesting
 * @dev A token vesting contract that locks ERC20 tokens and releases them
 * gradually over time with support for cliff periods and linear vesting.
 *
 * Features:
 * - Create vesting schedules with cliff + linear release
 * - Multiple schedules per beneficiary
 * - Revocable vesting (admin can revoke unvested tokens)
 * - Claim vested tokens
 * - View vesting details and claimable amounts
 *
 * Security:
 * - ReentrancyGuard on claim/revoke functions
 * - Owner-only access for admin functions
 * - SafeERC20 for token transfers
 * - Input validation on all parameters
 */
contract TokenVesting is ReentrancyGuard {
    using SafeERC20 for IERC20;

    // ============================================================
    //                         STRUCTS
    // ============================================================

    /**
     * @dev Represents a single vesting schedule.
     */
    struct VestingSchedule {
        address beneficiary;      // Address that will receive the tokens
        address token;            // ERC20 token address
        uint256 totalAmount;      // Total tokens to be vested
        uint256 startTime;        // Vesting start timestamp
        uint256 cliffDuration;    // Cliff period in seconds
        uint256 vestingDuration;  // Total vesting duration in seconds (including cliff)
        uint256 amountClaimed;    // Tokens already claimed by beneficiary
        bool revoked;             // Whether the schedule has been revoked
        bool initialized;         // Whether the schedule exists
    }

    // ============================================================
    //                      STATE VARIABLES
    // ============================================================

    /// @dev Contract owner (deployer)
    address public owner;

    /// @dev Counter for generating unique schedule IDs
    uint256 public scheduleCount;

    /// @dev Mapping from schedule ID to VestingSchedule
    mapping(uint256 => VestingSchedule) public vestingSchedules;

    /// @dev Mapping from beneficiary address to their schedule IDs
    mapping(address => uint256[]) private _beneficiarySchedules;

    /// @dev Total amount of tokens locked per token address
    mapping(address => uint256) public totalLockedTokens;

    // ============================================================
    //                          EVENTS
    // ============================================================

    /// @dev Emitted when a new vesting schedule is created
    event VestingScheduleCreated(
        uint256 indexed scheduleId,
        address indexed beneficiary,
        address indexed token,
        uint256 totalAmount,
        uint256 startTime,
        uint256 cliffDuration,
        uint256 vestingDuration
    );

    /// @dev Emitted when tokens are claimed by a beneficiary
    event TokensClaimed(
        uint256 indexed scheduleId,
        address indexed beneficiary,
        uint256 amount
    );

    /// @dev Emitted when a vesting schedule is revoked
    event VestingRevoked(
        uint256 indexed scheduleId,
        uint256 amountRevoked
    );

    /// @dev Emitted when ownership is transferred
    event OwnershipTransferred(
        address indexed previousOwner,
        address indexed newOwner
    );

    // ============================================================
    //                        MODIFIERS
    // ============================================================

    /// @dev Restricts function access to the contract owner
    modifier onlyOwner() {
        require(msg.sender == owner, "TokenVesting: caller is not the owner");
        _;
    }

    /// @dev Validates that a schedule exists
    modifier scheduleExists(uint256 scheduleId) {
        require(
            vestingSchedules[scheduleId].initialized,
            "TokenVesting: schedule does not exist"
        );
        _;
    }

    // ============================================================
    //                       CONSTRUCTOR
    // ============================================================

    /**
     * @dev Sets the deployer as the contract owner.
     */
    constructor() {
        owner = msg.sender;
        emit OwnershipTransferred(address(0), msg.sender);
    }

    // ============================================================
    //                    ADMIN FUNCTIONS
    // ============================================================

    /**
     * @dev Creates a new vesting schedule for a beneficiary.
     *
     * Requirements:
     * - Caller must be the owner
     * - Beneficiary cannot be zero address
     * - Token cannot be zero address
     * - Total amount must be greater than 0
     * - Vesting duration must be greater than 0
     * - Cliff duration must be less than or equal to vesting duration
     * - Owner must have approved this contract to spend the tokens
     *
     * @param beneficiary Address of the token beneficiary
     * @param token Address of the ERC20 token
     * @param totalAmount Total number of tokens to vest
     * @param startTime Unix timestamp for vesting start (0 = now)
     * @param cliffDuration Cliff period in seconds
     * @param vestingDuration Total vesting duration in seconds (including cliff)
     * @return scheduleId The ID of the created schedule
     */
    function createVestingSchedule(
        address beneficiary,
        address token,
        uint256 totalAmount,
        uint256 startTime,
        uint256 cliffDuration,
        uint256 vestingDuration
    ) external onlyOwner returns (uint256 scheduleId) {
        // Input validation
        require(beneficiary != address(0), "TokenVesting: beneficiary is zero address");
        require(token != address(0), "TokenVesting: token is zero address");
        require(totalAmount > 0, "TokenVesting: amount must be > 0");
        require(vestingDuration > 0, "TokenVesting: duration must be > 0");
        require(cliffDuration <= vestingDuration, "TokenVesting: cliff > duration");

        // Use current timestamp if startTime is 0
        if (startTime == 0) {
            startTime = block.timestamp;
        }
        require(startTime >= block.timestamp, "TokenVesting: start time is in the past");

        // Transfer tokens from owner to this contract
        IERC20(token).safeTransferFrom(msg.sender, address(this), totalAmount);

        // Create the schedule
        scheduleId = scheduleCount;
        vestingSchedules[scheduleId] = VestingSchedule({
            beneficiary: beneficiary,
            token: token,
            totalAmount: totalAmount,
            startTime: startTime,
            cliffDuration: cliffDuration,
            vestingDuration: vestingDuration,
            amountClaimed: 0,
            revoked: false,
            initialized: true
        });

        // Track schedule for beneficiary
        _beneficiarySchedules[beneficiary].push(scheduleId);

        // Update total locked tokens
        totalLockedTokens[token] += totalAmount;

        // Increment counter
        scheduleCount++;

        emit VestingScheduleCreated(
            scheduleId,
            beneficiary,
            token,
            totalAmount,
            startTime,
            cliffDuration,
            vestingDuration
        );
    }

    /**
     * @dev Revokes a vesting schedule. Unvested tokens are returned to the owner.
     * Already vested (but unclaimed) tokens remain claimable by the beneficiary.
     *
     * Requirements:
     * - Caller must be the owner
     * - Schedule must exist and not be already revoked
     *
     * @param scheduleId The ID of the schedule to revoke
     */
    function revokeVesting(uint256 scheduleId)
        external
        onlyOwner
        scheduleExists(scheduleId)
        nonReentrant
    {
        VestingSchedule storage schedule = vestingSchedules[scheduleId];
        require(!schedule.revoked, "TokenVesting: schedule already revoked");

        // Calculate how much has vested so far
        uint256 vestedAmount = _computeVestedAmount(schedule);
        uint256 unvestedAmount = schedule.totalAmount - vestedAmount;

        // Mark as revoked
        schedule.revoked = true;

        // Reduce the total amount to only what has vested
        // This ensures the beneficiary can still claim vested tokens
        schedule.totalAmount = vestedAmount;

        // Update total locked tokens
        totalLockedTokens[schedule.token] -= unvestedAmount;

        // Return unvested tokens to owner
        if (unvestedAmount > 0) {
            IERC20(schedule.token).safeTransfer(owner, unvestedAmount);
        }

        emit VestingRevoked(scheduleId, unvestedAmount);
    }

    /**
     * @dev Transfers ownership to a new address.
     * @param newOwner The address of the new owner
     */
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "TokenVesting: new owner is zero address");
        address oldOwner = owner;
        owner = newOwner;
        emit OwnershipTransferred(oldOwner, newOwner);
    }

    // ============================================================
    //                   BENEFICIARY FUNCTIONS
    // ============================================================

    /**
     * @dev Claims all available vested tokens for a schedule.
     *
     * Requirements:
     * - Schedule must exist
     * - Caller must be the beneficiary
     * - There must be tokens available to claim
     *
     * @param scheduleId The ID of the schedule to claim from
     */
    function claimVestedTokens(uint256 scheduleId)
        external
        scheduleExists(scheduleId)
        nonReentrant
    {
        VestingSchedule storage schedule = vestingSchedules[scheduleId];

        require(
            msg.sender == schedule.beneficiary,
            "TokenVesting: caller is not the beneficiary"
        );

        uint256 claimable = _getClaimableAmount(schedule);
        require(claimable > 0, "TokenVesting: no tokens available to claim");

        // Update claimed amount BEFORE transfer (checks-effects-interactions)
        schedule.amountClaimed += claimable;

        // Update total locked tokens
        totalLockedTokens[schedule.token] -= claimable;

        // Transfer tokens to beneficiary
        IERC20(schedule.token).safeTransfer(schedule.beneficiary, claimable);

        emit TokensClaimed(scheduleId, schedule.beneficiary, claimable);
    }

    // ============================================================
    //                     VIEW FUNCTIONS
    // ============================================================

    /**
     * @dev Computes the total vested amount for a schedule at the current time.
     * @param scheduleId The schedule ID
     * @return The total amount of tokens that have vested
     */
    function computeVestedAmount(uint256 scheduleId)
        external
        view
        scheduleExists(scheduleId)
        returns (uint256)
    {
        return _computeVestedAmount(vestingSchedules[scheduleId]);
    }

    /**
     * @dev Returns the amount of tokens available for claiming.
     * @param scheduleId The schedule ID
     * @return The amount of tokens that can be claimed right now
     */
    function getClaimableAmount(uint256 scheduleId)
        external
        view
        scheduleExists(scheduleId)
        returns (uint256)
    {
        return _getClaimableAmount(vestingSchedules[scheduleId]);
    }

    /**
     * @dev Returns the full details of a vesting schedule.
     * @param scheduleId The schedule ID
     * @return The VestingSchedule struct
     */
    function getVestingSchedule(uint256 scheduleId)
        external
        view
        scheduleExists(scheduleId)
        returns (VestingSchedule memory)
    {
        return vestingSchedules[scheduleId];
    }

    /**
     * @dev Returns all schedule IDs for a given beneficiary.
     * @param beneficiary The beneficiary address
     * @return An array of schedule IDs
     */
    function getSchedulesByBeneficiary(address beneficiary)
        external
        view
        returns (uint256[] memory)
    {
        return _beneficiarySchedules[beneficiary];
    }

    /**
     * @dev Returns the total number of vesting schedules created.
     * @return The schedule count
     */
    function getScheduleCount() external view returns (uint256) {
        return scheduleCount;
    }

    // ============================================================
    //                   INTERNAL FUNCTIONS
    // ============================================================

    /**
     * @dev Internal function to compute vested amount based on linear vesting with cliff.
     *
     * Vesting Logic:
     * 1. Before cliff: 0 tokens vested
     * 2. After cliff, before end: linear proportional vesting
     * 3. After end: 100% vested
     *
     * @param schedule The vesting schedule
     * @return The total vested amount
     */
    function _computeVestedAmount(VestingSchedule memory schedule)
        internal
        view
        returns (uint256)
    {
        // Before start time — nothing vested
        if (block.timestamp < schedule.startTime) {
            return 0;
        }

        uint256 elapsed = block.timestamp - schedule.startTime;

        // Before cliff — nothing vested
        if (elapsed < schedule.cliffDuration) {
            return 0;
        }

        // After full duration — everything vested
        if (elapsed >= schedule.vestingDuration) {
            return schedule.totalAmount;
        }

        // Linear vesting: (totalAmount * elapsed) / vestingDuration
        return (schedule.totalAmount * elapsed) / schedule.vestingDuration;
    }

    /**
     * @dev Internal function to compute the claimable (unclaimed vested) amount.
     * @param schedule The vesting schedule
     * @return The claimable amount
     */
    function _getClaimableAmount(VestingSchedule memory schedule)
        internal
        view
        returns (uint256)
    {
        uint256 vestedAmount = _computeVestedAmount(schedule);
        return vestedAmount - schedule.amountClaimed;
    }
}
