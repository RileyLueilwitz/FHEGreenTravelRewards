export const CONTRACT_ADDRESS = "0xA15ED92d12d602e0f2024C7AFe3692F17bCe6FA2"

export const CONTRACT_ABI = [
  "function owner() view returns (address)",
  "function currentPeriod() view returns (uint256)",
  "function startNewPeriod() external",
  "function submitTravelData(uint32 _carbonSaved) external",
  "function endPeriod() external",
  "function processNextParticipant() external",
  "function claimRewards() external",
  "function getCurrentPeriodInfo() external view returns (uint256 period, bool active, bool ended, uint256 startTime, uint256 endTime, uint256 participantCount, uint256 timeRemaining)",
  "function getParticipantStatus(address participant) external view returns (bool hasSubmitted, uint256 submissionTime, bool processed, uint32 reward)",
  "function getLifetimeStats(address participant) external view returns (uint256 totalRewards, uint256 totalCarbonSaved)",
  "function canEndPeriod() external view returns (bool)",
  "event PeriodStarted(uint256 indexed period, uint256 startTime)",
  "event TravelSubmitted(address indexed participant, uint256 indexed period)",
  "event RewardsCalculated(uint256 indexed period, address indexed participant, uint32 reward)",
  "event PeriodEnded(uint256 indexed period, uint32 totalRewards)",
  "event RewardsClaimed(address indexed participant, uint256 amount)"
]
