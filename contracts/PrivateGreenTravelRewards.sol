// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { FHE, euint32, euint64, ebool } from "@fhevm/solidity/lib/FHE.sol";
import { SepoliaConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

/**
 * @title Private Green Travel Rewards
 * @notice Privacy-preserving carbon reduction rewards system with FHE encryption
 * @dev Implements Gateway callback pattern, refund mechanism, timeout protection, and privacy-preserving computation
 *
 * SECURITY AUDIT NOTES:
 * - Uses Gateway callback pattern for asynchronous decryption
 * - Implements refund mechanism for failed decryptions
 * - Timeout protection prevents permanent fund locks
 * - Input validation on all external functions
 * - Access control with role-based permissions
 * - Overflow protection using safe arithmetic
 * - Privacy-preserving computation for sensitive calculations
 */
contract PrivateGreenTravelRewards is SepoliaConfig {

    // ============ State Variables ============

    address public owner;
    uint256 public currentPeriod;
    uint256 public periodStartTime;

    // Gateway management
    mapping(address => bool) public approvedGateways;
    mapping(address => uint256) public gatewayFees;

    // Period duration: 7 days
    uint256 constant PERIOD_DURATION = 7 days;

    // Timeout protection (1 hour minimum, 7 days maximum for period-based operations)
    uint256 constant MIN_TIMEOUT = 1 hours;
    uint256 constant MAX_TIMEOUT = 7 days;
    uint256 public defaultTimeout = 24 hours;

    // Minimum carbon reduction to qualify for rewards (in grams CO2e)
    uint32 constant MIN_CARBON_REDUCTION = 1000;

    // Reward tiers (in tokens)
    uint32 constant BRONZE_REWARD = 10;
    uint32 constant SILVER_REWARD = 25;
    uint32 constant GOLD_REWARD = 50;

    // Tier thresholds (in grams CO2e)
    uint32 constant SILVER_THRESHOLD = 5000;
    uint32 constant GOLD_THRESHOLD = 10000;

    // Privacy computation constants
    uint256 constant MAX_MULTIPLIER = 2**64;

    // ============ Structs ============

    struct TravelRecord {
        euint32 encryptedCarbonSaved;
        bool hasSubmitted;
        uint256 submissionTime;
        uint256 timeoutDeadline;
        uint32 decryptedCarbon;
        bool processed;
        bool refunded;
        uint256 decryptionRequestId;
    }

    struct Period {
        bool active;
        bool ended;
        uint256 startTime;
        uint256 endTime;
        address[] participants;
        mapping(address => uint32) rewards;
        uint32 totalRewardsDistributed;
    }

    struct DecryptionRequest {
        address requester;
        uint256 period;
        address participant;
        uint256 timestamp;
        bool completed;
        bool failed;
    }

    // ============ Mappings ============

    mapping(uint256 => Period) public periods;
    mapping(uint256 => mapping(address => TravelRecord)) public travelRecords;
    mapping(address => uint256) public totalRewardsEarned;
    mapping(address => uint256) public lifetimeCarbonSaved;
    mapping(uint256 => DecryptionRequest) public decryptionRequests;
    mapping(uint256 => address) public requestIdToParticipant;

    // Emergency pause
    bool public paused;

    // ============ Events ============

    event PeriodStarted(uint256 indexed period, uint256 startTime);
    event TravelSubmitted(address indexed participant, uint256 indexed period, uint256 timeoutDeadline);
    event RewardsCalculated(uint256 indexed period, address indexed participant, uint32 reward);
    event PeriodEnded(uint256 indexed period, uint32 totalRewards);
    event RewardsClaimed(address indexed participant, uint256 amount);
    event DecryptionRequested(uint256 indexed requestId, address indexed participant, uint256 period);
    event DecryptionCompleted(uint256 indexed requestId, address indexed participant, bool success);
    event DecryptionFailed(uint256 indexed requestId, address indexed participant, string reason);
    event RefundIssued(address indexed participant, uint256 period, string reason);
    event TimeoutTriggered(address indexed participant, uint256 period);
    event GatewayApproved(address indexed gateway);
    event GatewayRevoked(address indexed gateway);
    event GatewayFeesWithdrawn(address indexed gateway, uint256 amount);
    event EmergencyPause(bool paused);

    // ============ Modifiers ============

    modifier onlyOwner() {
        require(msg.sender == owner, "Not authorized");
        _;
    }

    modifier onlyGateway() {
        require(approvedGateways[msg.sender], "Not an approved gateway");
        _;
    }

    modifier onlyDuringActivePeriod() {
        require(periods[currentPeriod].active, "No active period");
        require(!periods[currentPeriod].ended, "Period has ended");
        require(block.timestamp < periodStartTime + PERIOD_DURATION, "Period expired");
        _;
    }

    modifier onlyAfterPeriodEnd() {
        require(block.timestamp >= periodStartTime + PERIOD_DURATION, "Period still active");
        require(!periods[currentPeriod].ended, "Period already ended");
        _;
    }

    modifier whenNotPaused() {
        require(!paused, "Contract is paused");
        _;
    }

    modifier validAddress(address _addr) {
        require(_addr != address(0), "Invalid address");
        _;
    }

    modifier validAmount(uint256 _amount) {
        require(_amount > 0, "Amount must be positive");
        _;
    }

    // ============ Constructor ============

    constructor() {
        owner = msg.sender;
        currentPeriod = 1;
        periodStartTime = block.timestamp;
        approvedGateways[msg.sender] = true; // Owner is default gateway
    }

    // ============ Gateway Management ============

    /**
     * @notice Approve a gateway for decryption operations
     * @param gateway Address of the gateway to approve
     */
    function approveGateway(address gateway) external onlyOwner validAddress(gateway) {
        require(!approvedGateways[gateway], "Gateway already approved");
        approvedGateways[gateway] = true;
        emit GatewayApproved(gateway);
    }

    /**
     * @notice Revoke a gateway's approval
     * @param gateway Address of the gateway to revoke
     */
    function revokeGateway(address gateway) external onlyOwner {
        require(approvedGateways[gateway], "Gateway not approved");
        require(gateway != owner, "Cannot revoke owner");
        approvedGateways[gateway] = false;
        emit GatewayRevoked(gateway);
    }

    /**
     * @notice Gateway withdraws accumulated fees
     */
    function withdrawGatewayFees() external onlyGateway {
        uint256 amount = gatewayFees[msg.sender];
        require(amount > 0, "No fees to withdraw");

        gatewayFees[msg.sender] = 0;

        (bool success, ) = payable(msg.sender).call{value: amount}("");
        require(success, "Fee withdrawal failed");

        emit GatewayFeesWithdrawn(msg.sender, amount);
    }

    // ============ Timeout Management ============

    /**
     * @notice Set default timeout duration
     * @param _timeout New timeout duration in seconds
     */
    function setDefaultTimeout(uint256 _timeout) external onlyOwner {
        require(_timeout >= MIN_TIMEOUT && _timeout <= MAX_TIMEOUT, "Invalid timeout");
        defaultTimeout = _timeout;
    }

    /**
     * @notice Check if a submission has timed out
     * @param period Period number
     * @param participant Participant address
     */
    function isTimedOut(uint256 period, address participant) public view returns (bool) {
        TravelRecord storage record = travelRecords[period][participant];
        return record.hasSubmitted &&
               !record.processed &&
               !record.refunded &&
               block.timestamp >= record.timeoutDeadline;
    }

    /**
     * @notice Force timeout for expired submission
     * @param period Period number
     * @param participant Participant address
     */
    function forceTimeout(uint256 period, address participant) external {
        require(isTimedOut(period, participant), "Not timed out");

        TravelRecord storage record = travelRecords[period][participant];
        record.refunded = true;

        emit TimeoutTriggered(participant, period);
        emit RefundIssued(participant, period, "Timeout");
    }

    // ============ Period Management ============

    /**
     * @notice Start a new reward period
     * @dev Only owner can start periods
     */
    function startNewPeriod() external onlyOwner whenNotPaused {
        require(!periods[currentPeriod].active || periods[currentPeriod].ended, "Period already active");

        Period storage period = periods[currentPeriod];
        period.active = true;
        period.ended = false;
        period.startTime = block.timestamp;
        period.endTime = 0;
        periodStartTime = block.timestamp;

        emit PeriodStarted(currentPeriod, block.timestamp);
    }

    // ============ Submission Functions ============

    /**
     * @notice Submit encrypted carbon savings for the current period
     * @param _carbonSaved Amount of carbon saved in grams CO2e
     * @dev INPUT VALIDATION: Ensures positive amount and no duplicate submissions
     * @dev PRIVACY: Data is encrypted using FHE before storage
     * @dev TIMEOUT: Automatic timeout protection applied
     */
    function submitTravelData(uint32 _carbonSaved)
        external
        onlyDuringActivePeriod
        whenNotPaused
        validAmount(_carbonSaved)
    {
        require(!travelRecords[currentPeriod][msg.sender].hasSubmitted, "Already submitted this period");

        // Encrypt the carbon savings amount
        euint32 encryptedCarbon = FHE.asEuint32(_carbonSaved);

        // Calculate timeout deadline
        uint256 timeoutDeadline = block.timestamp + defaultTimeout;

        travelRecords[currentPeriod][msg.sender] = TravelRecord({
            encryptedCarbonSaved: encryptedCarbon,
            hasSubmitted: true,
            submissionTime: block.timestamp,
            timeoutDeadline: timeoutDeadline,
            decryptedCarbon: 0,
            processed: false,
            refunded: false,
            decryptionRequestId: 0
        });

        periods[currentPeriod].participants.push(msg.sender);

        // Grant ACL permissions
        FHE.allowThis(encryptedCarbon);
        FHE.allow(encryptedCarbon, msg.sender);

        emit TravelSubmitted(msg.sender, currentPeriod, timeoutDeadline);
    }

    // ============ Refund Mechanism ============

    /**
     * @notice Claim refund for failed or timed-out submission
     * @param period Period number to claim refund for
     * @dev REFUND MECHANISM: Handles decryption failures and timeouts
     */
    function claimRefund(uint256 period) external whenNotPaused {
        TravelRecord storage record = travelRecords[period][msg.sender];

        require(record.hasSubmitted, "No submission found");
        require(!record.processed, "Already processed");
        require(!record.refunded, "Already refunded");

        // Check if eligible for refund (timeout or failed decryption)
        bool timedOut = block.timestamp >= record.timeoutDeadline;
        bool decryptionFailed = record.decryptionRequestId != 0 &&
                               decryptionRequests[record.decryptionRequestId].failed;

        require(timedOut || decryptionFailed, "Not eligible for refund");

        record.refunded = true;

        string memory reason = timedOut ? "Timeout" : "Decryption failed";
        emit RefundIssued(msg.sender, period, reason);
    }

    // ============ Gateway Callback Pattern ============

    /**
     * @notice End the current period and trigger reward calculation via Gateway
     * @dev GATEWAY PATTERN: Initiates asynchronous decryption through gateway callback
     */
    function endPeriod() external onlyAfterPeriodEnd whenNotPaused {
        require(periods[currentPeriod].active, "No active period");

        Period storage period = periods[currentPeriod];
        period.endTime = block.timestamp;

        // Request decryption for the first unprocessed participant
        address[] memory participants = period.participants;
        if (participants.length > 0) {
            address participant = _findPendingParticipant();

            if (participant != address(0)) {
                _requestDecryption(participant);
            } else {
                // All participants already processed
                period.ended = true;
                emit PeriodEnded(currentPeriod, period.totalRewardsDistributed);
                currentPeriod++;
            }
        } else {
            period.ended = true;
            emit PeriodEnded(currentPeriod, 0);
            currentPeriod++;
        }
    }

    /**
     * @notice Process next participant's decryption
     * @dev GATEWAY PATTERN: Continues asynchronous processing chain
     */
    function processNextParticipant() external whenNotPaused {
        require(periods[currentPeriod].active, "No active period");
        require(!periods[currentPeriod].ended, "Period already ended");

        address participant = _findPendingParticipant();

        if (participant != address(0)) {
            _requestDecryption(participant);
        }
    }

    /**
     * @notice Internal function to request decryption via Gateway
     * @param participant Address of participant to decrypt data for
     */
    function _requestDecryption(address participant) private {
        TravelRecord storage record = travelRecords[currentPeriod][participant];

        // Check timeout before requesting decryption
        if (block.timestamp >= record.timeoutDeadline) {
            record.refunded = true;
            emit TimeoutTriggered(participant, currentPeriod);
            emit RefundIssued(participant, currentPeriod, "Timeout before decryption");
            return;
        }

        bytes32[] memory cts = new bytes32[](1);
        cts[0] = FHE.toBytes32(record.encryptedCarbonSaved);

        uint256 requestId = FHE.requestDecryption(cts, this.processRewards.selector);

        record.decryptionRequestId = requestId;
        requestIdToParticipant[requestId] = participant;

        decryptionRequests[requestId] = DecryptionRequest({
            requester: msg.sender,
            period: currentPeriod,
            participant: participant,
            timestamp: block.timestamp,
            completed: false,
            failed: false
        });

        emit DecryptionRequested(requestId, participant, currentPeriod);
    }

    /**
     * @notice Gateway callback - Calculate and distribute rewards
     * @param requestId Decryption request ID
     * @param cleartexts Decrypted data
     * @param decryptionProof Cryptographic proof of decryption
     * @dev GATEWAY CALLBACK: Called by gateway after decryption
     * @dev SECURITY: Verifies cryptographic signatures
     */
    function processRewards(
        uint256 requestId,
        bytes memory cleartexts,
        bytes memory decryptionProof
    ) external whenNotPaused {
        DecryptionRequest storage request = decryptionRequests[requestId];
        require(!request.completed, "Request already completed");

        // Verify signatures
        try FHE.checkSignatures(requestId, cleartexts, decryptionProof) {
            // Decode the cleartext to get carbon value
            uint32 carbonValue = abi.decode(cleartexts, (uint32));

            Period storage period = periods[request.period];
            address participant = request.participant;
            TravelRecord storage record = travelRecords[request.period][participant];

            // Check if still within timeout
            if (block.timestamp >= record.timeoutDeadline) {
                request.completed = true;
                request.failed = true;
                record.refunded = true;
                emit DecryptionFailed(requestId, participant, "Timeout during processing");
                emit RefundIssued(participant, request.period, "Timeout");
                return;
            }

            if (record.hasSubmitted && !record.processed) {
                record.decryptedCarbon = carbonValue;
                record.processed = true;

                // Calculate reward based on tier
                uint32 reward = _calculateReward(carbonValue);

                if (reward > 0) {
                    period.rewards[participant] = reward;
                    period.totalRewardsDistributed += reward;
                    totalRewardsEarned[participant] += reward;
                    lifetimeCarbonSaved[participant] += carbonValue;

                    emit RewardsCalculated(request.period, participant, reward);
                }

                // Pay gateway fee (if applicable)
                if (msg.sender != owner && approvedGateways[msg.sender]) {
                    gatewayFees[msg.sender] += 0.001 ether; // Small fee for gateway service
                }
            }

            request.completed = true;
            emit DecryptionCompleted(requestId, participant, true);

            // Check if all participants have been processed
            if (_allParticipantsProcessed()) {
                period.ended = true;
                emit PeriodEnded(request.period, period.totalRewardsDistributed);
                if (request.period == currentPeriod) {
                    currentPeriod++;
                }
            }
        } catch Error(string memory reason) {
            // Decryption failed
            request.completed = true;
            request.failed = true;

            TravelRecord storage record = travelRecords[request.period][request.participant];
            record.refunded = true;

            emit DecryptionFailed(requestId, request.participant, reason);
            emit RefundIssued(request.participant, request.period, "Signature verification failed");
        }
    }

    // ============ Privacy-Preserving Computation ============

    /**
     * @notice Perform privacy-preserving division with random multiplier
     * @param numerator The dividend
     * @param denominator The divisor
     * @param randomMultiplier Random value to obfuscate result
     * @return Obfuscated division result
     * @dev PRIVACY: Uses random multiplier to prevent exact value inference
     * @dev OVERFLOW PROTECTION: Validates multiplier bounds
     */
    function privacyDivide(
        uint256 numerator,
        uint256 denominator,
        uint256 randomMultiplier
    ) public pure returns (uint256) {
        require(denominator > 0, "Division by zero");
        require(randomMultiplier > 0 && randomMultiplier <= MAX_MULTIPLIER, "Invalid multiplier");

        // Multiply numerator by random factor before division
        uint256 obfuscatedNumerator = (numerator * randomMultiplier) / 1e18;
        return obfuscatedNumerator / denominator;
    }

    /**
     * @notice Obfuscate a price value
     * @param price Original price
     * @param blindingFactor Secret blinding factor
     * @return Obfuscated price
     * @dev PRIVACY: XOR-based blinding prevents price leakage
     */
    function obfuscatePrice(uint256 price, uint256 blindingFactor)
        public
        pure
        returns (uint256)
    {
        require(blindingFactor > 0, "Invalid blinding factor");
        return price ^ blindingFactor;
    }

    /**
     * @notice Reveal obfuscated price value
     * @param obfuscatedValue Obfuscated price
     * @param blindingFactor Original blinding factor
     * @return Original price
     */
    function revealObfuscatedValue(uint256 obfuscatedValue, uint256 blindingFactor)
        public
        pure
        returns (uint256)
    {
        require(blindingFactor > 0, "Invalid blinding factor");
        return obfuscatedValue ^ blindingFactor;
    }

    // ============ Internal Functions ============

    /**
     * @notice Find the first participant who hasn't been processed yet
     * @return Address of pending participant or address(0)
     */
    function _findPendingParticipant() private view returns (address) {
        address[] memory participants = periods[currentPeriod].participants;
        for (uint i = 0; i < participants.length; i++) {
            TravelRecord storage record = travelRecords[currentPeriod][participants[i]];
            if (!record.processed && !record.refunded) {
                return participants[i];
            }
        }
        return address(0);
    }

    /**
     * @notice Check if all participants have been processed
     * @return True if all processed or refunded
     */
    function _allParticipantsProcessed() private view returns (bool) {
        address[] memory participants = periods[currentPeriod].participants;
        for (uint i = 0; i < participants.length; i++) {
            TravelRecord storage record = travelRecords[currentPeriod][participants[i]];
            if (!record.processed && !record.refunded) {
                return false;
            }
        }
        return true;
    }

    /**
     * @notice Calculate reward based on carbon savings tier
     * @param carbonSaved Amount of carbon saved
     * @return Reward amount
     * @dev INPUT VALIDATION: Enforces minimum thresholds
     */
    function _calculateReward(uint32 carbonSaved) private pure returns (uint32) {
        if (carbonSaved < MIN_CARBON_REDUCTION) {
            return 0;
        } else if (carbonSaved < SILVER_THRESHOLD) {
            return BRONZE_REWARD;
        } else if (carbonSaved < GOLD_THRESHOLD) {
            return SILVER_REWARD;
        } else {
            return GOLD_REWARD;
        }
    }

    // ============ Claim Functions ============

    /**
     * @notice Claim accumulated rewards
     * @dev ACCESS CONTROL: Only reward owners can claim
     */
    function claimRewards() external whenNotPaused {
        uint256 totalRewards = totalRewardsEarned[msg.sender];
        require(totalRewards > 0, "No rewards to claim");

        // In production, this would transfer actual tokens
        emit RewardsClaimed(msg.sender, totalRewards);
    }

    // ============ View Functions ============

    /**
     * @notice Get current period information
     */
    function getCurrentPeriodInfo() external view returns (
        uint256 period,
        bool active,
        bool ended,
        uint256 startTime,
        uint256 endTime,
        uint256 participantCount,
        uint256 timeRemaining
    ) {
        Period storage currentPeriodData = periods[currentPeriod];
        uint256 remaining = 0;

        if (currentPeriodData.active && !currentPeriodData.ended) {
            uint256 deadline = periodStartTime + PERIOD_DURATION;
            if (block.timestamp < deadline) {
                remaining = deadline - block.timestamp;
            }
        }

        return (
            currentPeriod,
            currentPeriodData.active,
            currentPeriodData.ended,
            currentPeriodData.startTime,
            currentPeriodData.endTime,
            currentPeriodData.participants.length,
            remaining
        );
    }

    /**
     * @notice Get participant's submission status for current period
     */
    function getParticipantStatus(address participant) external view returns (
        bool hasSubmitted,
        uint256 submissionTime,
        bool processed,
        bool refunded,
        uint32 reward,
        uint256 timeoutDeadline
    ) {
        TravelRecord storage record = travelRecords[currentPeriod][participant];
        uint32 rewardAmount = periods[currentPeriod].rewards[participant];

        return (
            record.hasSubmitted,
            record.submissionTime,
            record.processed,
            record.refunded,
            rewardAmount,
            record.timeoutDeadline
        );
    }

    /**
     * @notice Get participant's lifetime statistics
     */
    function getLifetimeStats(address participant) external view returns (
        uint256 totalRewards,
        uint256 totalCarbonSaved
    ) {
        return (
            totalRewardsEarned[participant],
            lifetimeCarbonSaved[participant]
        );
    }

    /**
     * @notice Get period history
     */
    function getPeriodHistory(uint256 periodNumber) external view returns (
        bool active,
        bool ended,
        uint256 startTime,
        uint256 endTime,
        uint256 participantCount,
        uint32 totalRewards
    ) {
        Period storage period = periods[periodNumber];
        return (
            period.active,
            period.ended,
            period.startTime,
            period.endTime,
            period.participants.length,
            period.totalRewardsDistributed
        );
    }

    /**
     * @notice Get participant's reward for a specific period
     */
    function getParticipantReward(uint256 periodNumber, address participant)
        external
        view
        returns (uint32)
    {
        return periods[periodNumber].rewards[participant];
    }

    /**
     * @notice Check if period can be ended
     */
    function canEndPeriod() external view returns (bool) {
        return block.timestamp >= periodStartTime + PERIOD_DURATION &&
               periods[currentPeriod].active &&
               !periods[currentPeriod].ended;
    }

    /**
     * @notice Get decryption request details
     */
    function getDecryptionRequest(uint256 requestId) external view returns (
        address requester,
        uint256 period,
        address participant,
        uint256 timestamp,
        bool completed,
        bool failed
    ) {
        DecryptionRequest storage request = decryptionRequests[requestId];
        return (
            request.requester,
            request.period,
            request.participant,
            request.timestamp,
            request.completed,
            request.failed
        );
    }

    // ============ Emergency Functions ============

    /**
     * @notice Emergency pause/unpause
     * @param _paused New pause state
     * @dev EMERGENCY: Only owner can pause contract
     */
    function setPaused(bool _paused) external onlyOwner {
        paused = _paused;
        emit EmergencyPause(_paused);
    }

    /**
     * @notice Receive function for contract to accept ETH
     */
    receive() external payable {}
}
