# Privacy Gateway Contracts

A comprehensive smart contract system implementing privacy-preserving operations with Gateway callback pattern, refund mechanisms, and homomorphic encryption support.

Live Demo: https://fhe-green-travel-rewards.vercel.app/


## Overview

This project provides a secure, decentralized architecture for handling encrypted transactions with the following key features:

- **Gateway Callback Pattern**: Asynchronous decryption through trusted gateway nodes
- **Refund Mechanism**: Automatic refunds for failed or timed-out decryption requests
- **Timeout Protection**: Prevents permanent transaction locks
- **Privacy-Preserving Computation**: Division and price obfuscation without revealing actual values
- **Input Validation**: Comprehensive validation at contract boundaries
- **Access Control**: Role-based authorization for gateway operations
- **Overflow Protection**: Safe arithmetic operations with bounds checking

## Core Features

### 1. Gateway Callback Pattern

Users submit encrypted requests with callback contracts. Trusted gateways:
1. Receive encrypted data off-chain
2. Decrypt using private keys
3. Submit decrypted data back to contract
4. Trigger callback on specified contract
5. Receive accumulated fees for services

**Benefits:**
- Decryption happens off-chain (gateway controlled)
- No single point of failure
- Scalable to multiple gateways
- Asynchronous processing model

### 2. Refund Mechanism

Automatic refunds for:
- **Decryption Failures**: If gateway callback fails, user can claim refund
- **Timeout Expiration**: If request times out, refund is available
- **User-Initiated**: Users can explicitly claim if eligible

**Guarantees:**
- No loss of funds for failed transactions
- Automatic or on-demand refund processing
- Event-based tracking for all refunds

### 3. Timeout Protection

- **Default**: 24 hours (configurable)
- **Minimum**: 1 hour (prevents immediate refunds)
- **Maximum**: 30 days (prevents indefinite locks)
- **Forced Timeout**: Can be manually triggered after expiration

### 4. Privacy-Preserving Computation

#### Division with Privacy
- Random multiplier injection prevents exact inference
- Deterministic noise for additional privacy
- Maintains proportionality of results

#### Price Obfuscation
- XOR-based blinding factors
- Modular arithmetic encryption
- Only authorized parties can reveal

## Architecture

### Core Components

#### PrivacyGateway.sol
Main contract managing encrypted request lifecycle

**Key Functions:**
- `submitDecryptionRequest()` - Submit encrypted data
- `completeDecryption()` - Gateway completes decryption
- `claimRefund()` - User claims refund
- `forceTimeout()` - Manually timeout expired requests
- `approveGateway()` - Manage gateway nodes

**Protections:**
- ReentrancyGuard on all state changes
- Pausable emergency functionality
- Event logging for all operations

#### PrivacyComputation.sol
Privacy-preserving computation operations

**Operations:**
- `privacyDivide()` - Protected division
- `obfuscatePrice()` - Hide price values
- `revealObfuscatedValue()` - Authorized revelation
- Safe arithmetic with overflow checks

#### ExamplePrivacyDApp.sol
Reference implementation demonstrating usage patterns

## Workflow

### Request Lifecycle

```
1. User submits encrypted request
   ├─ Amount recorded
   ├─ Encrypted data stored
   ├─ Callback contract specified
   └─ Timeout initialized

2. Gateway processes request (off-chain)
   └─ Decrypts data with private key

3. Gateway submits decryption result
   ├─ Triggers callback
   ├─ Processes transaction
   └─ Receives fees on success

4. On Failure or Timeout
   └─ User can claim refund
```

## Deployment

### Quick Start

```bash
# Install dependencies
npm install

# Compile contracts
npm run compile

# Run tests
npm run test

# Deploy to localhost
npm run deploy:localhost

# Deploy to Sepolia
npm run deploy:sepolia
```

### Configuration

Create `.env` file:

```env
# Private key for deployment
PRIVATE_KEY=your_private_key_here

# RPC endpoints
INFURA_API_KEY=your_infura_key
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_KEY

# Etherscan verification
ETHERSCAN_API_KEY=your_etherscan_key

# Gas reporting
REPORT_GAS=true
```

## API Reference

### PrivacyGateway

#### submitDecryptionRequest
```solidity
function submitDecryptionRequest(
    bytes calldata encryptedData,
    address callbackAddress,
    uint256 timeoutDuration
) external payable returns (bytes32)
```

Submit encrypted data for decryption

**Parameters:**
- `encryptedData`: Encrypted transaction data
- `callbackAddress`: Contract receiving callback
- `timeoutDuration`: Custom timeout (0 = default)

**Returns:** Unique request ID

#### completeDecryption
```solidity
function completeDecryption(
    bytes32 requestId,
    bytes calldata decryptedData
) external onlyGateway
```

Complete decryption and trigger callback

#### claimRefund
```solidity
function claimRefund(bytes32 requestId)
external onlyRequester
```

Claim refund for failed or timed-out request

#### Gateway Management
```solidity
function approveGateway(address gateway) external onlyOwner
function revokeGateway(address gateway) external onlyOwner
function withdrawGatewayBalance(address gateway) external
```

Manage approved gateway nodes

### PrivacyComputation

#### privacyDivide
```solidity
function privacyDivide(
    uint256 numerator,
    uint256 denominator,
    uint256 randomMultiplier
) external pure returns (uint256)
```

Perform division without revealing exact values

#### obfuscatePrice
```solidity
function obfuscatePrice(
    uint256 price,
    uint256 blindingFactor
) external pure returns (uint256)
```

Hide price from external observers

#### revealObfuscatedValue
```solidity
function revealObfuscatedValue(
    uint256 obfuscatedValue,
    uint256 blindingFactor
) external pure returns (uint256)
```

Recover original price with correct factor

## Testing

### Run Tests

```bash
# All tests
npm run test

# Specific test file
npx hardhat test test/PrivacyGateway.test.js

# With coverage
npm run coverage

# With gas reporting
npm run gas-report
```

### Test Coverage

- Gateway management (approve, revoke)
- Request creation and validation
- Decryption completion and callbacks
- Refund mechanisms
- Timeout detection
- Privacy computation operations
- Pause/unpause functionality
- Safe arithmetic operations

## Security

### Input Validation

- Empty encrypted data rejected
- Invalid callback addresses rejected
- Timeout bounds enforced (1 hour - 30 days)
- Payment validation (> 0)

### Access Control

- Only approved gateways can complete decryption
- Only requesters can claim refunds
- Only owner manages gateways

### Reentrancy Protection

- ReentrancyGuard on all state-modifying functions
- Callbacks happen before state updates
- Pull over push pattern

### Overflow Protection

- Modular arithmetic with bounds
- Safe multiplication and addition
- Multiplier size constraints (≤ 2^64)

## Use Cases

### 1. Private Trading
- Encrypt trade details with obfuscated prices
- Gateway decrypts and executes
- Price obfuscation prevents front-running

### 2. Confidential Auctions
- Bid amounts encrypted and time-locked
- Automatic refund if auction fails
- Timeout prevents bid lockup

### 3. Private OTC Trades
- Counterparty risk via timeout protection
- Automatic refund on failure
- Gateway as neutral intermediary

### 4. Confidential Payments
- Recipient and amount encrypted
- Privacy-preserving fee calculations
- Timeout prevents payment stuck

## File Structure

```
D:\
├── contracts/
│   ├── PrivacyGateway.sol
│   ├── PrivacyComputation.sol
│   ├── ExamplePrivacyDApp.sol
│   └── interfaces/
│       ├── IGatewayCallback.sol
│       └── IPrivacyComputation.sol
├── test/
│   ├── PrivacyGateway.test.js
│   ├── PrivacyComputation.test.js
│   └── MockCallback.sol
├── scripts/
│   └── deploy.js
├── docs/
│   ├── ARCHITECTURE.md
│   ├── API.md
│   └── SECURITY.md
├── hardhat.config.js
├── package.json
├── .env.example
└── README.md
```

## Gas Optimization

- Efficient homomorphic operation patterns
- Minimal state mutations
- Event-based indexing reduces storage
- Optimized modular inverse calculation

## License

MIT License

## Support

For issues and feature requests, please check the documentation or contact the development team.

## Disclaimer

This code is provided for educational and research purposes. Conduct security audits before production deployment. Ensure compliance with applicable regulations in your jurisdiction.
