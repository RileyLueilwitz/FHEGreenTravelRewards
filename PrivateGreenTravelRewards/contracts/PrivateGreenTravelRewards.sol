// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { FHE, euint32, euint64, ebool } from "@fhevm/solidity/lib/FHE.sol";
import { SepoliaConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

contract PrivateGreenTravelRewards is SepoliaConfig {

    address public owner;
    uint256 public currentPeriod;
    uint256 public periodStartTime;

    // Period duration: 7 days
    uint256 constant PERIOD_DURATION = 7 days;

    // Minimum carbon reduction to qualify for rewards (in grams CO2e)
    uint32 constant MIN_CARBON_REDUCTION = 1000;

    // Reward tiers (in tokens)
    uint32 constant BRONZE_REWARD = 10;
    uint32 constant SILVER_REWARD = 25;
    uint32 constant GOLD_REWARD = 50;

    // Tier thresholds (in grams CO2e)
    uint32 constant SILVER_THRESHOLD = 5000;
    uint32 constant GOLD_THRESHOLD = 10000;

    struct TravelRecord {
        euint32 encryptedCarbonSaved;
        bool hasSubmitted;
        uint256 submissionTime;
        uint32 decryptedCarbon;
        bool processed;
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

    mapping(uint256 => Period) public periods;
    mapping(uint256 => mapping(address => TravelRecord)) public travelRecords;
    mapping(address => uint256) public totalRewardsEarned;
    mapping(address => uint256) public lifetimeCarbonSaved;

    event PeriodStarted(uint256 indexed period, uint256 startTime);
    event TravelSubmitted(address indexed participant, uint256 indexed period);
    event RewardsCalculated(uint256 indexed period, address indexed participant, uint32 reward);
    event PeriodEnded(uint256 indexed period, uint32 totalRewards);
    event RewardsClaimed(address indexed participant, uint256 amount);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not authorized");
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

    constructor() {
        owner = msg.sender;
        currentPeriod = 1;
        periodStartTime = block.timestamp;
    }

    // Start a new reward period
    function startNewPeriod() external onlyOwner {
        require(!periods[currentPeriod].active || periods[currentPeriod].ended, "Period already active");

        Period storage period = periods[currentPeriod];
        period.active = true;
        period.ended = false;
        period.startTime = block.timestamp;
        period.endTime = 0;
        periodStartTime = block.timestamp;

        emit PeriodStarted(currentPeriod, block.timestamp);
    }

    // Submit encrypted carbon savings for the current period
    function submitTravelData(uint32 _carbonSaved) external onlyDuringActivePeriod {
        require(_carbonSaved > 0, "Carbon saved must be positive");
        require(!travelRecords[currentPeriod][msg.sender].hasSubmitted, "Already submitted this period");

        // Encrypt the carbon savings amount
        euint32 encryptedCarbon = FHE.asEuint32(_carbonSaved);

        travelRecords[currentPeriod][msg.sender] = TravelRecord({
            encryptedCarbonSaved: encryptedCarbon,
            hasSubmitted: true,
            submissionTime: block.timestamp,
            decryptedCarbon: 0,
            processed: false
        });

        periods[currentPeriod].participants.push(msg.sender);

        // Grant ACL permissions
        FHE.allowThis(encryptedCarbon);
        FHE.allow(encryptedCarbon, msg.sender);

        emit TravelSubmitted(msg.sender, currentPeriod);
    }

    // End the current period and trigger reward calculation
    function endPeriod() external onlyAfterPeriodEnd {
        require(periods[currentPeriod].active, "No active period");

        Period storage period = periods[currentPeriod];
        period.endTime = block.timestamp;

        // Request decryption for the first unprocessed participant
        address[] memory participants = period.participants;
        if (participants.length > 0) {
            address participant = _findPendingParticipant();

            if (participant != address(0)) {
                TravelRecord storage record = travelRecords[currentPeriod][participant];
                bytes32[] memory cts = new bytes32[](1);
                cts[0] = FHE.toBytes32(record.encryptedCarbonSaved);
                FHE.requestDecryption(cts, this.processRewards.selector);
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

    // Process next participant's decryption (called after processRewards callback)
    function processNextParticipant() external {
        require(periods[currentPeriod].active, "No active period");
        require(!periods[currentPeriod].ended, "Period already ended");

        address participant = _findPendingParticipant();

        if (participant != address(0)) {
            TravelRecord storage record = travelRecords[currentPeriod][participant];
            bytes32[] memory cts = new bytes32[](1);
            cts[0] = FHE.toBytes32(record.encryptedCarbonSaved);
            FHE.requestDecryption(cts, this.processRewards.selector);
        }
    }

    // Decryption callback - Calculate and distribute rewards
    function processRewards(
        uint256 requestId,
        bytes memory cleartexts,
        bytes memory decryptionProof
    ) external {
        // Verify signatures
        FHE.checkSignatures(requestId, cleartexts, decryptionProof);

        // Decode the cleartext to get carbon value
        uint32 carbonValue = abi.decode(cleartexts, (uint32));

        Period storage period = periods[currentPeriod];

        // Find the participant for this decryption
        address participant = _findPendingParticipant();

        if (participant != address(0)) {
            TravelRecord storage record = travelRecords[currentPeriod][participant];

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

                    emit RewardsCalculated(currentPeriod, participant, reward);
                }
            }
        }

        // Check if all participants have been processed
        if (_allParticipantsProcessed()) {
            period.ended = true;
            emit PeriodEnded(currentPeriod, period.totalRewardsDistributed);
            currentPeriod++;
        }
    }

    // Find the first participant who hasn't been processed yet
    function _findPendingParticipant() private view returns (address) {
        address[] memory participants = periods[currentPeriod].participants;
        for (uint i = 0; i < participants.length; i++) {
            if (!travelRecords[currentPeriod][participants[i]].processed) {
                return participants[i];
            }
        }
        return address(0);
    }

    // Check if all participants have been processed
    function _allParticipantsProcessed() private view returns (bool) {
        address[] memory participants = periods[currentPeriod].participants;
        for (uint i = 0; i < participants.length; i++) {
            if (!travelRecords[currentPeriod][participants[i]].processed) {
                return false;
            }
        }
        return true;
    }

    // Calculate reward based on carbon savings tier
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

    // Claim accumulated rewards (placeholder for token transfer)
    function claimRewards() external {
        uint256 totalRewards = totalRewardsEarned[msg.sender];
        require(totalRewards > 0, "No rewards to claim");

        // In production, this would transfer actual tokens
        // For now, just emit an event
        emit RewardsClaimed(msg.sender, totalRewards);
    }

    // Get current period information
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

    // Get participant's submission status for current period
    function getParticipantStatus(address participant) external view returns (
        bool hasSubmitted,
        uint256 submissionTime,
        bool processed,
        uint32 reward
    ) {
        TravelRecord storage record = travelRecords[currentPeriod][participant];
        uint32 rewardAmount = periods[currentPeriod].rewards[participant];

        return (
            record.hasSubmitted,
            record.submissionTime,
            record.processed,
            rewardAmount
        );
    }

    // Get participant's lifetime statistics
    function getLifetimeStats(address participant) external view returns (
        uint256 totalRewards,
        uint256 totalCarbonSaved
    ) {
        return (
            totalRewardsEarned[participant],
            lifetimeCarbonSaved[participant]
        );
    }

    // Get period history
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

    // Get participant's reward for a specific period
    function getParticipantReward(uint256 periodNumber, address participant) external view returns (uint32) {
        return periods[periodNumber].rewards[participant];
    }

    // Check if period can be ended
    function canEndPeriod() external view returns (bool) {
        return block.timestamp >= periodStartTime + PERIOD_DURATION &&
               periods[currentPeriod].active &&
               !periods[currentPeriod].ended;
    }
}