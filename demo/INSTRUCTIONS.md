# Demo Assets Instructions

This folder contains demonstration materials for the Private Green Travel Rewards project.

## Required Assets

### 1. Video Demonstration (`demo-video.mp4`)
A video showcasing the complete user flow:
- Connecting MetaMask wallet
- Viewing current period status
- Submitting encrypted carbon savings data
- Admin starting/ending periods
- Claiming rewards
- Recommended duration: 2-5 minutes

### 2. Screenshots

#### `period-started.png`
- Screenshot from Etherscan showing a successful "Period Started" transaction
- Should display:
  - Transaction hash
  - Contract address: 0xA15ED92d12d602e0f2024C7AFe3692F17bCe6FA2
  - PeriodStarted event emission
  - Gas used and transaction status

#### `submit-travel.png`
- Screenshot of a user submitting travel data
- Should show:
  - Transaction on Etherscan
  - TravelSubmitted event
  - Encrypted data being sent to contract
  - Transaction confirmation

#### `rewards-calculated.png`
- Screenshot showing reward calculation
- Should display:
  - RewardsCalculated event with participant address and reward amount
  - Period number
  - Transaction details

#### `claim-rewards.png`
- Screenshot of rewards claim transaction
- Should show:
  - RewardsClaimed event
  - Token amount claimed
  - Successful transaction status

## How to Add Assets

1. Record your demo video and save as `demo-video.mp4` in this folder
2. Take screenshots during actual transactions on Sepolia Etherscan
3. Save screenshots with the exact filenames listed above
4. Ensure all images are clear and readable (recommended: PNG format, minimum 1200px width)

## Tips for Quality Screenshots

- Use Etherscan's light mode for better readability
- Highlight or circle important information if needed
- Capture the full transaction details panel
- Include transaction hash and timestamp for authenticity
- Make sure contract address is visible

## Alternative Approach

If you don't have screenshots yet:
- Remove the screenshot section from README.md
- Or replace with placeholder text: "Coming Soon - Transaction examples will be added after mainnet deployment"
- Keep only the video demonstration section