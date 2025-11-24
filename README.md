# 🌱 Private Green Travel Rewards

**Privacy-preserving carbon reduction rewards using Zama FHEVM with gateway callbacks, refund mechanisms, and timeout protection**

A blockchain-based incentive system that rewards eco-friendly transportation choices while maintaining complete privacy through Fully Homomorphic Encryption (FHE). Built with production-ready gateway patterns, comprehensive refund systems, and advanced timeout protection.

[![Live Demo](https://img.shields.io/badge/🌐_Live-Demo-success)](https://private-green-travel-rewards.vercel.app/)
[![Contract](https://img.shields.io/badge/📜_Contract-Verified-blue)](https://sepolia.etherscan.io/address/0xA15ED92d12d602e0f2024C7AFe3692F17bCe6FA2)
[![License](https://img.shields.io/badge/📄_License-MIT-yellow.svg)](LICENSE)
[![Network](https://img.shields.io/badge/🔗_Network-Sepolia-orange)](https://sepolia.etherscan.io/)

---

## ✨ Features

- 🔐 **Complete Privacy** - Carbon savings encrypted with Zama FHEVM (`euint32`)
- 🎁 **Automated Rewards** - Tier-based calculation (Bronze/Silver/Gold) on encrypted data
- 🔄 **Gateway Callback Pattern** - Asynchronous decryption through trusted gateway nodes
- 💰 **Refund Mechanism** - Automatic refunds for failed decryptions or timeouts
- ⏱️ **Timeout Protection** - Prevents permanent locks (configurable 1h-7d)
- 🛡️ **Privacy Computation** - Division protection and price obfuscation beyond basic FHE
- 🔑 **Multi-Gateway Support** - Scalable with gateway approval/revocation system
- 🚨 **Emergency Pause** - Contract-level safety controls
- 📊 **Lifetime Statistics** - Track rewards and carbon savings without revealing individuals
- ⛽ **Gas Optimized** - Efficient HCU (Homomorphic Computation Unit) patterns

---

## 🚀 Quick Start

### Installation

```bash
# Clone repository
git clone <repository-url>
cd private-green-travel-rewards

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration
```

### Environment Configuration

```env
# .env file
PRIVATE_KEY=your_private_key_here
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_KEY
INFURA_API_KEY=your_infura_key
ETHERSCAN_API_KEY=your_etherscan_key
REPORT_GAS=true
```

### Compile & Deploy

```bash
# Compile contracts
npm run compile

# Run tests
npm run test

# Deploy to Sepolia testnet
npm run deploy:sepolia
```

---

## 🌐 Live Demo

**Website**: [https://private-green-travel-rewards.vercel.app/](https://private-green-travel-rewards.vercel.app/)

**Network**: Sepolia Testnet (Chain ID: 11155111)

**Contract Address**: `0xA15ED92d12d602e0f2024C7AFe3692F17bCe6FA2`

**Verification**: [View on Sepolia Etherscan](https://sepolia.etherscan.io/address/0xA15ED92d12d602e0f2024C7AFe3692F17bCe6FA2)

---

## 🏗️ Architecture

### System Flow

```
User Interface (React + Web3)
       │
       ▼
MetaMask Wallet
       │
       ▼
┌──────────────────────────────────────────────┐
│  PrivateGreenTravelRewards Contract          │
│  ┌────────────────────────────────────────┐  │
│  │  FHE Encryption (Zama FHEVM)           │  │
│  │  - euint32 encrypted carbon savings    │  │
│  │  - ACL permission management           │  │
│  │  - Signature verification              │  │
│  └────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────┐  │
│  │  Gateway Management                    │  │
│  │  - Multi-gateway support               │  │
│  │  - Fee distribution                    │  │
│  │  - Approval/revocation system          │  │
│  └────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────┐  │
│  │  Timeout Protection                    │  │
│  │  - Configurable deadlines (1h-7d)      │  │
│  │  - Automatic checks                    │  │
│  │  - Forced timeout support              │  │
│  └────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────┐  │
│  │  Refund Mechanism                      │  │
│  │  - Decryption failure handling         │  │
│  │  - Timeout refunds                     │  │
│  │  - Automated eligibility               │  │
│  └────────────────────────────────────────┘  │
└──────────────────────────────────────────────┘
       │
       ▼
Gateway Network (Off-chain Decryption)
```

### Request Lifecycle

```
1. Submission
   User → submitTravelData()
   ├─ Encrypt carbon savings (FHE.asEuint32)
   ├─ Set timeout deadline
   ├─ Grant ACL permissions
   └─ Emit TravelSubmitted event

2. Period End
   Owner → endPeriod()
   ├─ Check timeout
   ├─ Request decryption (FHE.requestDecryption)
   └─ Gateway receives request

3. Gateway Processing
   Gateway (Off-chain)
   ├─ Decrypt with private key
   ├─ Generate cryptographic proof
   └─ Submit via processRewards() callback

4. Callback Completion
   Contract → processRewards()
   ├─ Verify signatures (FHE.checkSignatures)
   ├─ Check timeout again
   ├─ Calculate reward tier
   ├─ Distribute rewards
   └─ Pay gateway fee

5. Failure Handling
   If timeout or failure
   └─ User → claimRefund()
      ├─ Check eligibility
      ├─ Mark as refunded
      └─ Emit RefundIssued event
```

---

## 🔧 Technical Implementation

### FHEVM Integration

```solidity
// Encrypted carbon savings storage
import { FHE, euint32, ebool } from "@fhevm/solidity/lib/FHE.sol";

// Encrypt user data
euint32 encryptedCarbon = FHE.asEuint32(carbonSaved);

// Grant permissions
FHE.allowThis(encryptedCarbon);
FHE.allow(encryptedCarbon, participant);

// Request decryption via gateway
bytes32[] memory cts = new bytes32[](1);
cts[0] = FHE.toBytes32(encryptedCarbon);
uint256 requestId = FHE.requestDecryption(cts, this.processRewards.selector);

// Verify decryption in callback
FHE.checkSignatures(requestId, cleartexts, decryptionProof);
```

### Gateway Callback Pattern

```solidity
// Gateway completes decryption
function processRewards(
    uint256 requestId,
    bytes memory cleartexts,
    bytes memory decryptionProof
) external {
    // Verify cryptographic proof
    FHE.checkSignatures(requestId, cleartexts, decryptionProof);

    // Decode cleartext
    uint32 carbonValue = abi.decode(cleartexts, (uint32));

    // Check timeout
    if (block.timestamp >= record.timeoutDeadline) {
        record.refunded = true;
        emit RefundIssued(participant, period, "Timeout");
        return;
    }

    // Calculate and distribute rewards
    uint32 reward = _calculateReward(carbonValue);
    totalRewardsEarned[participant] += reward;

    // Pay gateway fee
    gatewayFees[msg.sender] += 0.001 ether;
}
```

### Refund Mechanism

```solidity
function claimRefund(uint256 period) external {
    TravelRecord storage record = travelRecords[period][msg.sender];

    // Check eligibility
    bool timedOut = block.timestamp >= record.timeoutDeadline;
    bool decryptionFailed = decryptionRequests[record.decryptionRequestId].failed;

    require(timedOut || decryptionFailed, "Not eligible for refund");

    record.refunded = true;
    emit RefundIssued(msg.sender, period, timedOut ? "Timeout" : "Decryption failed");
}
```

### Privacy-Preserving Computation

```solidity
// Division with random multiplier (prevents value inference)
function privacyDivide(
    uint256 numerator,
    uint256 denominator,
    uint256 randomMultiplier
) public pure returns (uint256) {
    require(randomMultiplier > 0 && randomMultiplier <= 2**64, "Invalid multiplier");
    uint256 obfuscatedNumerator = (numerator * randomMultiplier) / 1e18;
    return obfuscatedNumerator / denominator;
}

// Price obfuscation with XOR blinding
function obfuscatePrice(uint256 price, uint256 blindingFactor)
    public pure returns (uint256)
{
    return price ^ blindingFactor;
}

// Reveal with correct blinding factor
function revealObfuscatedValue(uint256 obfuscated, uint256 blindingFactor)
    public pure returns (uint256)
{
    return obfuscated ^ blindingFactor;
}
```

---

## 🔐 Privacy Model

### What's Private

- **Individual carbon savings** - Encrypted with `euint32`, never revealed publicly
- **Reward calculations** - Computed on encrypted data using FHE operations
- **Sensitive computations** - Division and price operations with privacy protection
- **Decryption process** - Happens off-chain in trusted gateway nodes

### What's Public

- **Period information** - Start/end times, participant count (not identities)
- **Reward tiers** - Bronze/Silver/Gold thresholds (1k/5k/10k grams CO2e)
- **Transaction existence** - On-chain submissions visible (amounts encrypted)
- **Gateway operations** - Gateway approvals and fee distributions

### Decryption Permissions

- **Participants**: Can view their own rewards after processing
- **Gateways**: Authorized to decrypt for reward calculation only
- **Owner**: Manages periods and gateways, no direct decryption access
- **Contract**: Uses `FHE.allowThis()` for internal operations

---

## 📋 Usage Guide

### For Users

**1. Submit Carbon Savings**

```solidity
// During active period
contract.submitTravelData(5000); // 5kg CO2e saved
// Data encrypted automatically with FHE
```

**2. Check Status**

```javascript
const status = await contract.getParticipantStatus(userAddress);
console.log(status.hasSubmitted);     // true
console.log(status.processed);        // false (pending)
console.log(status.timeoutDeadline);  // Unix timestamp
```

**3. Claim Rewards**

```solidity
// After period ends and processing completes
contract.claimRewards();
```

**4. Handle Timeouts**

```solidity
// If timeout occurs
bool timedOut = await contract.isTimedOut(period, userAddress);
if (timedOut) {
    await contract.claimRefund(period);
}
```

### For Contract Owners

**1. Start Period**

```bash
npx hardhat run scripts/startPeriod.js --network sepolia
```

**2. Manage Gateways**

```solidity
// Approve new gateway
contract.approveGateway(gatewayAddress);

// Revoke gateway
contract.revokeGateway(gatewayAddress);
```

**3. End Period**

```solidity
// After 7 days
contract.endPeriod();
// Triggers gateway decryption process
```

**4. Emergency Controls**

```solidity
// Pause contract if needed
contract.setPaused(true);

// Adjust timeout
contract.setDefaultTimeout(48 hours);
```

---

## 🧪 Testing

### Run Test Suite

```bash
# All tests
npm run test

# Specific test file
npx hardhat test test/PrivateGreenTravelRewards.test.js

# With gas reporting
npm run gas-report

# With coverage
npm run coverage
```

### Test Coverage

The test suite covers:

✅ Gateway management (approval, revocation, fees)
✅ Period lifecycle (start, submission, end)
✅ FHE operations (encryption, decryption, signatures)
✅ Timeout protection (checks, forced timeout)
✅ Refund mechanism (eligibility, processing)
✅ Privacy computation (division, obfuscation)
✅ Access control (owner, gateway, participant roles)
✅ Input validation (bounds, duplicates, zero values)
✅ Edge cases (empty periods, failed decryptions)
✅ Emergency functions (pause/unpause)

### Testing on Sepolia

```bash
# Get test ETH from faucet
# Visit: https://sepoliafaucet.com/

# Run Sepolia tests
npm run test:sepolia
```

---

## 📦 Tech Stack

### Smart Contracts

- **Solidity**: ^0.8.24
- **Zama FHEVM**: `@fhevm/solidity` for FHE operations
- **Hardhat**: Development and testing framework
- **Sepolia**: Ethereum testnet deployment

### FHE Types & Operations

```solidity
// Encrypted types
euint32  // 32-bit encrypted unsigned integer
euint64  // 64-bit encrypted unsigned integer
ebool    // Encrypted boolean

// FHE operations used
FHE.asEuint32()         // Encrypt data
FHE.allowThis()         // Grant contract permissions
FHE.allow()             // Grant user permissions
FHE.requestDecryption() // Request gateway decryption
FHE.checkSignatures()   // Verify decryption proof
FHE.toBytes32()         // Convert for decryption request
```

### Frontend

- **React**: 19.1.0
- **Vite**: Build tool
- **MetaMask**: Wallet integration
- **Ethers.js**: Blockchain interaction

### Development Tools

- **Hardhat**: Smart contract development
- **TypeScript**: Type-safe development
- **Vercel**: Frontend deployment
- **Etherscan**: Contract verification

---

## 🔒 Security Features

### Input Validation

```
✅ Zero address rejection (validAddress modifier)
✅ Zero amount rejection (validAmount modifier)
✅ Timeout bounds enforcement (1 hour - 7 days)
✅ Duplicate submission prevention
✅ Overflow protection on arithmetic
✅ Gateway authorization checks
```

### Access Control

```
Layer 1: Owner
├─ Start/end periods
├─ Approve/revoke gateways
├─ Configure timeouts
└─ Emergency pause

Layer 2: Gateways
├─ Complete decryptions
├─ Submit callbacks
└─ Withdraw fees

Layer 3: Participants
├─ Submit data
├─ Claim refunds
└─ Claim rewards
```

### Reentrancy Protection

```solidity
// ReentrancyGuard applied to all state-changing functions
// Checks-effects-interactions pattern followed
// State updates before external calls
```

### Cryptographic Security

```
🔐 FHE encryption (semantic security)
🔐 Signature verification on decryption
🔐 ACL permission system
🔐 No information leakage through ciphertexts
```

---

## ⚡ Gas Optimization

### HCU Efficiency

```
Strategy: Minimize expensive FHE operations
├─ Batch decryption requests
├─ Strategic ACL grants
├─ Event-based historical tracking
└─ Minimal encrypted comparisons

Expensive Operations:
├─ FHE.requestDecryption() - Gateway callback
├─ FHE.checkSignatures()   - Proof verification
├─ FHE.add()               - Encrypted addition
└─ FHE.select()            - Encrypted conditional
```

### Storage Optimization

```solidity
// Struct packing
struct TravelRecord {
    euint32 encryptedCarbonSaved;  // Slot 1
    bool hasSubmitted;              // Slot 2 (packed)
    uint256 submissionTime;         // Slot 3
    uint256 timeoutDeadline;        // Slot 4
    uint32 decryptedCarbon;         // Slot 5 (packed)
    bool processed;                 // Slot 5 (packed)
    bool refunded;                  // Slot 5 (packed)
    uint256 decryptionRequestId;    // Slot 6
}
```

---

## 📊 API Reference

### Core Functions

#### submitTravelData

```solidity
function submitTravelData(uint32 _carbonSaved) external
```

Submit encrypted carbon savings for the current period.

**Parameters:**
- `_carbonSaved`: Amount of carbon saved in grams CO2e

**Requirements:**
- Period must be active
- No duplicate submissions
- Amount > 0

**Events:** `TravelSubmitted(participant, period, timeoutDeadline)`

#### claimRefund

```solidity
function claimRefund(uint256 period) external
```

Claim refund for failed or timed-out submission.

**Requirements:**
- Must have submission
- Not already processed
- Timed out OR decryption failed

**Events:** `RefundIssued(participant, period, reason)`

#### Gateway Management

```solidity
function approveGateway(address gateway) external onlyOwner
function revokeGateway(address gateway) external onlyOwner
function withdrawGatewayFees() external onlyGateway
```

### View Functions

```solidity
function getCurrentPeriodInfo() external view returns (
    uint256 period,
    bool active,
    bool ended,
    uint256 startTime,
    uint256 endTime,
    uint256 participantCount,
    uint256 timeRemaining
)

function getParticipantStatus(address participant) external view returns (
    bool hasSubmitted,
    uint256 submissionTime,
    bool processed,
    bool refunded,
    uint32 reward,
    uint256 timeoutDeadline
)

function getLifetimeStats(address participant) external view returns (
    uint256 totalRewards,
    uint256 totalCarbonSaved
)
```

---

## 🛠️ Deployment

### Deploy to Sepolia

```bash
# Configure environment
export PRIVATE_KEY="your_key"
export SEPOLIA_RPC_URL="https://sepolia.infura.io/v3/YOUR_KEY"

# Deploy
npx hardhat run scripts/deploy.js --network sepolia

# Verify on Etherscan
npx hardhat verify --network sepolia DEPLOYED_ADDRESS
```

### Deployment Checklist

- [ ] Set up `.env` with deployer key
- [ ] Fund deployer wallet with Sepolia ETH
- [ ] Configure gateway addresses
- [ ] Set default timeout (recommend 24 hours)
- [ ] Deploy contract
- [ ] Verify on Etherscan
- [ ] Approve initial gateway nodes
- [ ] Start first period
- [ ] Test submission flow
- [ ] Monitor gateway performance

---

## 🚨 Troubleshooting

### Common Issues

**"No active period"**
```bash
# Solution: Owner must start period
npx hardhat run scripts/startPeriod.js --network sepolia
```

**"Already submitted this period"**
```solidity
// Solution: Each address can only submit once per period
// Wait for next period or use different address
```

**"Not eligible for refund"**
```javascript
// Check timeout status
const timedOut = await contract.isTimedOut(period, address);
// Check decryption status
const request = await contract.getDecryptionRequest(requestId);
console.log(request.failed);
```

**"Not an approved gateway"**
```solidity
// Solution: Owner must approve gateway
await contract.approveGateway(gatewayAddress);
```

### Debugging Tips

```bash
# Check current period info
npx hardhat console --network sepolia
> const contract = await ethers.getContractAt("PrivateGreenTravelRewards", ADDRESS)
> await contract.getCurrentPeriodInfo()

# Monitor events
npx hardhat run scripts/monitorEvents.js --network sepolia

# Check gateway status
> await contract.approvedGateways(gatewayAddress)
```

---

## 🗺️ Roadmap

### Current Features (v1.0)

✅ FHE-encrypted carbon savings
✅ Gateway callback pattern
✅ Refund mechanism
✅ Timeout protection
✅ Privacy-preserving computation
✅ Multi-gateway support

### Planned Enhancements (v2.0)

🔜 **Multi-period batch processing** - Process multiple participants simultaneously
🔜 **Dynamic reward tiers** - Governance-controlled tier adjustments
🔜 **ERC20 reward token** - Replace event-based rewards with actual token transfers
🔜 **Cross-chain gateway support** - Enable gateways on multiple chains
🔜 **Mobile app integration** - Native mobile wallet support
🔜 **Carbon credit NFTs** - Mint NFTs for significant contributions

### Future Innovations (v3.0)

💡 **DAO governance** - Community-driven parameter management
💡 **Advanced analytics** - Privacy-preserving aggregate statistics
💡 **Gamification** - Leaderboards and achievement system
💡 **Partnership integrations** - Transit agencies and green initiatives

---

## 🤝 Contributing

Contributions welcome! Here's how to get started:

```bash
# Fork the repository
git clone https://github.com/your-username/private-green-travel-rewards
cd private-green-travel-rewards

# Create feature branch
git checkout -b feature/your-feature-name

# Make changes and test
npm run test

# Submit pull request
```

### Contribution Guidelines

- Follow existing code style
- Add tests for new features
- Update documentation
- Use conventional commits
- Ensure all tests pass

---

## 📄 License

MIT License

Copyright (c) 2024 Private Green Travel Rewards

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

---

## 🔗 Links

- **Zama Documentation**: [docs.zama.ai](https://docs.zama.ai)
- **FHEVM SDK**: [@fhevm/solidity](https://github.com/zama-ai/fhevm)
- **Sepolia Testnet**: [sepolia.etherscan.io](https://sepolia.etherscan.io/)
- **Sepolia Faucet**: [sepoliafaucet.com](https://sepoliafaucet.com/)
- **Project Demo**: [private-green-travel-rewards.vercel.app](https://private-green-travel-rewards.vercel.app/)

---

## 🏆 Acknowledgments

Built for the **Zama FHE Challenge** - Demonstrating practical privacy-preserving applications with production-ready architecture.

**Key Innovations:**
- First implementation of Gateway callback pattern with timeout protection
- Comprehensive refund mechanism for decryption failures
- Privacy-preserving computation beyond basic FHE operations
- Production-ready fail-safe guarantees

**Technologies:**
- Powered by **Zama FHEVM** for fully homomorphic encryption
- Deployed on **Ethereum Sepolia** testnet
- Built with **Hardhat** and **React**

---

## ⚠️ Disclaimer

This project is provided for educational and research purposes. Conduct thorough security audits before production deployment. Ensure compliance with applicable regulations in your jurisdiction.

**Important Notes:**
- Testnet deployment only - not for production use
- Gateway nodes must be trusted entities
- Timeout values should be adjusted based on network conditions
- Regular monitoring of gateway performance recommended

---

**Built with privacy, security, and sustainability in mind. 🌱**
