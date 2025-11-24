# Architecture Documentation

## System Overview

The Private Green Travel Rewards system is built on a sophisticated architecture that combines Fully Homomorphic Encryption (FHE), Gateway callback patterns, timeout protection, and privacy-preserving computation to create a secure, privacy-first carbon reduction rewards platform.

## Core Architecture Principles

### 1. Privacy-First Design
Every piece of user data is encrypted using ZAMA's FHE technology, ensuring zero-knowledge proofs throughout the lifecycle.

### 2. Asynchronous Processing
Gateway callback pattern enables scalable, off-chain decryption without blocking on-chain operations.

### 3. Fail-Safe Mechanisms
Comprehensive refund and timeout systems ensure no user data or rewards are permanently locked.

### 4. Gas Efficiency
Optimized HCU (Homomorphic Computation Unit) usage patterns minimize computational costs.

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         User Interface                           │
│                    (Web3 DApp Frontend)                          │
└───────────────────────┬─────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│                   MetaMask / Web3 Wallet                         │
└───────────────────────┬─────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│              PrivateGreenTravelRewards Contract                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  FHE Encryption Layer (ZAMA)                             │  │
│  │  - euint32 encrypted carbon savings                      │  │
│  │  - ACL permission management                             │  │
│  │  - Signature verification                                │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Gateway Management System                               │  │
│  │  - Gateway approval/revocation                           │  │
│  │  - Fee distribution                                      │  │
│  │  - Multi-gateway support                                 │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Timeout Protection System                               │  │
│  │  - Configurable timeouts (1h - 7d)                       │  │
│  │  - Automatic timeout checks                              │  │
│  │  - Forced timeout capability                             │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Refund Mechanism                                        │  │
│  │  - Decryption failure refunds                            │  │
│  │  - Timeout refunds                                       │  │
│  │  - Automated eligibility checking                        │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Privacy Computation Module                              │  │
│  │  - privacyDivide() with random multipliers               │  │
│  │  - obfuscatePrice() with XOR blinding                    │  │
│  │  - revealObfuscatedValue()                               │  │
│  └──────────────────────────────────────────────────────────┘  │
└───────────────────────┬─────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Gateway Network                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │  Gateway 1   │  │  Gateway 2   │  │  Gateway N   │         │
│  │  (Owner)     │  │  (Approved)  │  │  (Approved)  │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
│         │                  │                  │                  │
│         └──────────────────┴──────────────────┘                 │
│                            │                                     │
│                   Off-Chain Decryption                          │
│                   (Private Keys)                                │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow Architecture

### 1. Submission Flow

```
User Interface
     │
     │ 1. User enters carbon savings amount
     ▼
FHE Encryption Client
     │
     │ 2. Encrypt data locally
     ▼
submitTravelData()
     │
     │ 3. Store encrypted data on-chain
     │ 4. Set timeout deadline
     │ 5. Grant ACL permissions
     ▼
Blockchain State
     │
     │ Event: TravelSubmitted
     ▼
User Interface (Confirmation)
```

### 2. Decryption Flow (Gateway Callback Pattern)

```
Period End
     │
     │ 1. Owner calls endPeriod()
     ▼
_requestDecryption()
     │
     │ 2. Check timeout
     │ 3. Create decryption request
     │ 4. Call FHE.requestDecryption()
     ▼
ZAMA Gateway Network
     │
     │ 5. Off-chain decryption
     │ 6. Generate proof
     ▼
processRewards() [Callback]
     │
     │ 7. Verify signatures (FHE.checkSignatures)
     │ 8. Decode cleartext
     │ 9. Check timeout again
     │ 10. Calculate reward tier
     │ 11. Distribute rewards
     │ 12. Pay gateway fee
     ▼
Updated Blockchain State
     │
     │ Event: RewardsCalculated
     │ Event: DecryptionCompleted
     ▼
User Interface (Reward notification)
```

### 3. Refund Flow

```
Timeout or Failure
     │
     │ 1. User checks eligibility
     ▼
isTimedOut() / Check decryptionFailed
     │
     │ 2. Eligibility confirmed
     ▼
claimRefund()
     │
     │ 3. Verify conditions
     │ 4. Mark as refunded
     │ 5. Emit RefundIssued event
     ▼
User receives refund eligibility
     │
     │ Event: RefundIssued
     ▼
User Interface (Refund notification)
```

## Component Architecture

### 1. Smart Contract Structure

```solidity
PrivateGreenTravelRewards
├── State Variables
│   ├── Owner & Period Management
│   ├── Gateway Registry
│   ├── Timeout Configuration
│   ├── Reward Tiers & Thresholds
│   └── Privacy Constants
│
├── Data Structures
│   ├── TravelRecord (with timeout & refund fields)
│   ├── Period (with participant tracking)
│   └── DecryptionRequest (with failure tracking)
│
├── Modifiers
│   ├── onlyOwner
│   ├── onlyGateway
│   ├── onlyDuringActivePeriod
│   ├── onlyAfterPeriodEnd
│   ├── whenNotPaused
│   ├── validAddress
│   └── validAmount
│
├── Core Functions
│   ├── Period Management
│   │   ├── startNewPeriod()
│   │   └── endPeriod()
│   │
│   ├── Submission & Processing
│   │   ├── submitTravelData()
│   │   ├── processNextParticipant()
│   │   ├── processRewards()
│   │   └── _requestDecryption()
│   │
│   ├── Gateway Management
│   │   ├── approveGateway()
│   │   ├── revokeGateway()
│   │   └── withdrawGatewayFees()
│   │
│   ├── Timeout Management
│   │   ├── setDefaultTimeout()
│   │   ├── isTimedOut()
│   │   └── forceTimeout()
│   │
│   ├── Refund Mechanism
│   │   └── claimRefund()
│   │
│   ├── Privacy Computation
│   │   ├── privacyDivide()
│   │   ├── obfuscatePrice()
│   │   └── revealObfuscatedValue()
│   │
│   └── View Functions
│       ├── getCurrentPeriodInfo()
│       ├── getParticipantStatus()
│       ├── getLifetimeStats()
│       ├── getPeriodHistory()
│       ├── getDecryptionRequest()
│       └── canEndPeriod()
│
└── Emergency Functions
    └── setPaused()
```

### 2. Gateway Architecture

```
Gateway Node Components:

┌─────────────────────────────────────┐
│         Gateway Node                │
│                                     │
│  ┌───────────────────────────────┐ │
│  │  Blockchain Monitor           │ │
│  │  - Watch DecryptionRequested  │ │
│  │  - Track pending requests     │ │
│  └───────────────────────────────┘ │
│             │                       │
│             ▼                       │
│  ┌───────────────────────────────┐ │
│  │  Decryption Engine            │ │
│  │  - Private key management     │ │
│  │  - FHE decryption             │ │
│  │  - Proof generation           │ │
│  └───────────────────────────────┘ │
│             │                       │
│             ▼                       │
│  ┌───────────────────────────────┐ │
│  │  Callback Manager             │ │
│  │  - Submit decrypted data      │ │
│  │  - Handle callback response   │ │
│  │  - Retry on failure           │ │
│  └───────────────────────────────┘ │
│             │                       │
│             ▼                       │
│  ┌───────────────────────────────┐ │
│  │  Fee Collection               │ │
│  │  - Track earned fees          │ │
│  │  - Withdraw accumulated fees  │ │
│  └───────────────────────────────┘ │
└─────────────────────────────────────┘
```

### 3. Timeout Protection Architecture

```
Timeout Lifecycle:

Submission (T=0)
     │
     │ timeoutDeadline = now + defaultTimeout
     ▼
Storage
     │
     │ Waiting for decryption...
     ▼
Decryption Request (T=X)
     │
     │ if (now >= timeoutDeadline) → Refund & Skip
     ▼
Processing (T=Y)
     │
     │ if (now >= timeoutDeadline) → Refund & Fail
     ▼
Complete or Timeout
     │
     ├─ Success → Reward distributed
     │
     └─ Timeout → Refund available

Timeout Checks:
1. Before requesting decryption (_requestDecryption)
2. During callback processing (processRewards)
3. Manual check (isTimedOut)
4. Forced timeout (forceTimeout)
```

### 4. Refund Mechanism Architecture

```
Refund Eligibility Decision Tree:

User calls claimRefund(period)
     │
     ▼
Check hasSubmitted? ─No→ REJECT
     │
     Yes
     ▼
Check processed? ─Yes→ REJECT
     │
     No
     ▼
Check refunded? ─Yes→ REJECT
     │
     No
     ▼
Check eligibility:
     │
     ├─ Timeout? (now >= timeoutDeadline)
     │     │
     │     Yes → APPROVE REFUND
     │
     └─ Decryption Failed?
           │
           ├─ decryptionRequestId != 0?
           │     │
           │     Yes
           │     ▼
           │  decryptionRequests[id].failed?
           │     │
           │     Yes → APPROVE REFUND
           │     │
           │     No → REJECT
           │
           └─ No → REJECT

Refund Processing:
1. Set record.refunded = true
2. Emit RefundIssued event
3. User loses eligibility for rewards
```

## Privacy-Preserving Computation

### 1. Division with Privacy Protection

**Problem:** Standard division reveals exact values
**Solution:** Random multiplier obfuscation

```solidity
function privacyDivide(
    uint256 numerator,
    uint256 denominator,
    uint256 randomMultiplier
) public pure returns (uint256) {
    // Step 1: Multiply by random factor
    uint256 obfuscatedNumerator = (numerator * randomMultiplier) / 1e18;

    // Step 2: Perform division on obfuscated value
    return obfuscatedNumerator / denominator;
}
```

**Example:**
```
Original: 1000 / 10 = 100 (exposed)
With multiplier (r=1.5e18):
  - Obfuscated numerator: (1000 * 1.5e18) / 1e18 = 1500
  - Result: 1500 / 10 = 150
  - External observers can't determine original 1000
```

### 2. Price Obfuscation

**Problem:** Price values leaked on-chain
**Solution:** XOR-based blinding

```solidity
// Obfuscate
function obfuscatePrice(uint256 price, uint256 blindingFactor)
    returns (uint256)
{
    return price ^ blindingFactor;
}

// Reveal
function revealObfuscatedValue(uint256 obfuscated, uint256 blindingFactor)
    returns (uint256)
{
    return obfuscated ^ blindingFactor;  // XOR is reversible
}
```

**Properties:**
- XOR operation is symmetric: `(A ^ B) ^ B = A`
- Only holder of blindingFactor can reveal
- Computational efficiency (single operation)
- No storage of original value

## Security Architecture

### 1. Access Control Layers

```
Layer 1: Owner Controls
├── Start/end periods
├── Approve/revoke gateways
├── Set timeout configuration
├── Pause/unpause contract
└── Emergency functions

Layer 2: Gateway Controls
├── Complete decryption requests
├── Submit callback results
├── Withdraw earned fees
└── Process rewards

Layer 3: Participant Controls
├── Submit travel data
├── Claim refunds
├── Claim rewards
└── View personal stats

Layer 4: Public Read Access
├── View period info
├── View contract state
└── Check timeout status
```

### 2. Input Validation Stack

```
1. Modifier Level
   ├── validAddress() - Reject address(0)
   ├── validAmount() - Reject zero amounts
   ├── whenNotPaused() - Reject if paused
   └── onlyDuringActivePeriod() - Reject if inactive

2. Function Level
   ├── Check duplicates
   ├── Check bounds (timeout limits)
   ├── Check existence (period, participant)
   └── Check state (processed, refunded)

3. State Transition Level
   ├── Verify preconditions
   ├── Update state atomically
   └── Emit events

4. External Call Level
   ├── Checks-effects-interactions pattern
   ├── Reentrancy guards
   └── Return value checking
```

### 3. Cryptographic Security

```
FHE Layer:
├── Encryption: FHE.asEuint32()
├── Access Control: FHE.allowThis(), FHE.allow()
├── Decryption Request: FHE.requestDecryption()
├── Signature Verification: FHE.checkSignatures()
└── Type Conversion: FHE.toBytes32()

Guarantees:
├── Semantic security (IND-CPA)
├── Homomorphic operations preserve privacy
├── No information leakage through ciphertexts
└── Signature verification prevents tampering
```

## Gas Optimization Strategy

### 1. HCU (Homomorphic Computation Unit) Optimization

```
Expensive Operations (High HCU):
├── FHE.add() - Encrypted addition
├── FHE.select() - Encrypted conditional
├── FHE.eq() - Encrypted comparison
└── FHE.requestDecryption() - Decryption request

Optimization Strategies:
├── Batch decryption requests where possible
├── Minimize encrypted comparisons
├── Use events instead of storage for historical data
└── Strategic ACL permission grants
```

### 2. Storage Optimization

```
Gas-Efficient Patterns:
├── Pack structs to minimize storage slots
├── Use mappings over arrays for lookups
├── Emit events for historical tracking
├── Delete obsolete data to get gas refunds
└── Use memory for temporary calculations
```

### 3. Computation Optimization

```
Efficient Algorithms:
├── Single-pass participant processing
├── Early returns on condition failures
├── Reuse computed values
├── Minimize loop iterations
└── Use pure/view functions where possible
```

## Event Architecture

### Event Hierarchy

```
Core Events:
├── PeriodStarted(period, startTime)
├── PeriodEnded(period, totalRewards)
├── TravelSubmitted(participant, period, timeoutDeadline)
└── RewardsCalculated(period, participant, reward)

Gateway Events:
├── GatewayApproved(gateway)
├── GatewayRevoked(gateway)
├── GatewayFeesWithdrawn(gateway, amount)
└── DecryptionRequested(requestId, participant, period)

Processing Events:
├── DecryptionCompleted(requestId, participant, success)
├── DecryptionFailed(requestId, participant, reason)
└── RewardsClaimed(participant, amount)

Protection Events:
├── RefundIssued(participant, period, reason)
├── TimeoutTriggered(participant, period)
└── EmergencyPause(paused)
```

## Deployment Architecture

### Multi-Environment Strategy

```
1. Development (Localhost)
   ├── Hardhat Network
   ├── Fast mining
   ├── Easy debugging
   └── Mock gateways

2. Testnet (Sepolia)
   ├── Real network conditions
   ├── ZAMA FHE testnet integration
   ├── Public gateway nodes
   └── Gas profiling

3. Production (Mainnet)
   ├── Multi-signature owner
   ├── Multiple approved gateways
   ├── Conservative timeout settings
   └── Monitoring & alerting
```

### Configuration Management

```
Environment Variables:
├── PRIVATE_KEY - Deployer key
├── SEPOLIA_RPC_URL - Network endpoint
├── ETHERSCAN_API_KEY - Verification
├── GATEWAY_ADDRESSES - Approved gateways
└── DEFAULT_TIMEOUT - Initial timeout setting

Contract Parameters:
├── PERIOD_DURATION - 7 days
├── MIN_TIMEOUT - 1 hour
├── MAX_TIMEOUT - 7 days
├── Reward tiers - Bronze/Silver/Gold
└── Gateway fee - 0.001 ETH
```

## Monitoring & Observability

### Key Metrics to Track

```
Performance Metrics:
├── Average decryption time
├── Gateway success rate
├── Timeout frequency
└── Gas usage per operation

Business Metrics:
├── Active participants per period
├── Total carbon savings
├── Reward distribution
└── Gateway fee accumulation

Security Metrics:
├── Failed decryption attempts
├── Refund claim rate
├── Timeout trigger frequency
└── Unauthorized access attempts
```

### Event Monitoring

```
Critical Events to Monitor:
├── DecryptionFailed - Investigate gateway issues
├── TimeoutTriggered - Check network congestion
├── RefundIssued - Track user experience
├── EmergencyPause - Alert on contract issues
└── Multiple GatewayRevoked - Security concern
```

## Upgrade Strategy

### Future Enhancements

```
Planned Upgrades:
├── Multi-period batch processing
├── Dynamic reward tiers
├── Governance for timeout configuration
├── ERC20 reward token integration
└── Cross-chain gateway support

Upgrade Pattern:
├── Use proxy pattern for upgradability
├── Implement gradual migration
├── Maintain backward compatibility
├── Test extensively on testnet
└── Coordinate with gateway operators
```

## Conclusion

This architecture provides a robust, privacy-preserving, and fail-safe system for carbon reduction rewards. The combination of FHE encryption, gateway callback patterns, timeout protection, refund mechanisms, and privacy-preserving computation creates a production-ready solution that prioritizes user privacy and data security while maintaining operational efficiency and gas optimization.

Key architectural strengths:
- **Privacy**: Zero-knowledge proofs throughout
- **Reliability**: Comprehensive fail-safe mechanisms
- **Scalability**: Asynchronous processing with multiple gateways
- **Security**: Multi-layered validation and access control
- **Efficiency**: Optimized HCU usage and gas consumption
- **Transparency**: Comprehensive event logging and monitoring
