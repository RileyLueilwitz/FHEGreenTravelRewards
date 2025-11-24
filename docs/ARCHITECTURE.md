# Architecture Documentation

## System Overview

The Privacy Gateway system is a decentralized architecture for privacy-preserving transaction processing. It separates encrypted data submission from decryption execution while providing strong guarantees around refunds and timeouts.

## Core Design Principles

### 1. Separation of Concerns

**On-Chain Components:**
- Request management and lifecycle tracking
- Callback execution and result handling
- Refund and timeout logic
- Access control and gateway management

**Off-Chain Components:**
- Decryption processing by approved gateways
- Encrypted data storage and retrieval
- Gateway selection and load balancing

### 2. Asynchronous Processing

The Gateway callback pattern enables:
- Non-blocking request submission
- Parallel decryption processing
- Event-driven state updates

### 3. Fail-Safe Guarantees

- Timeout protection prevents permanent locks
- Automatic refund on callback failure
- User-initiated refund after timeout

## Component Architecture

### PrivacyGateway Contract

```
┌─────────────────────────────────────────────────┐
│                  PrivacyGateway                 │
├─────────────────────────────────────────────────┤
│  State:                                         │
│  ├─ requests: mapping(bytes32 => Request)       │
│  ├─ approvedGateways: mapping(address => bool)  │
│  ├─ gatewayBalance: mapping(address => uint)    │
│  └─ timeoutConfig: (default, min, max)          │
├─────────────────────────────────────────────────┤
│  Functions:                                     │
│  ├─ submitDecryptionRequest()                   │
│  ├─ completeDecryption()                        │
│  ├─ claimRefund()                               │
│  ├─ forceTimeout()                              │
│  ├─ approveGateway()                            │
│  ├─ revokeGateway()                             │
│  └─ withdrawGatewayBalance()                    │
├─────────────────────────────────────────────────┤
│  Modifiers:                                     │
│  ├─ onlyGateway                                 │
│  ├─ onlyRequester                               │
│  └─ requestExists                               │
└─────────────────────────────────────────────────┘
```

### PrivacyComputation Contract

```
┌─────────────────────────────────────────────────┐
│              PrivacyComputation                 │
├─────────────────────────────────────────────────┤
│  Constants:                                     │
│  ├─ PRIVACY_MULTIPLIER_BASE: 2^128             │
│  ├─ MAX_SAFE_MULTIPLIER: 2^64                  │
│  └─ OBFUSCATION_PRIME: 2^256 - 1               │
├─────────────────────────────────────────────────┤
│  Functions:                                     │
│  ├─ privacyDivide()                             │
│  ├─ obfuscatePrice()                            │
│  ├─ revealObfuscatedValue()                     │
│  ├─ safeMultiply()                              │
│  └─ safeAdd()                                   │
├─────────────────────────────────────────────────┤
│  Internal:                                      │
│  ├─ _generateNoise()                            │
│  └─ _modularInverse()                           │
└─────────────────────────────────────────────────┘
```

## Request Lifecycle

### State Machine

```
                     ┌─────────────┐
                     │   PENDING   │
                     └──────┬──────┘
                            │
              ┌─────────────┼─────────────┐
              │             │             │
              ▼             │             ▼
      ┌─────────────┐       │     ┌─────────────┐
      │ PROCESSING  │       │     │  (TIMEOUT)  │
      └──────┬──────┘       │     └──────┬──────┘
              │             │             │
     ┌────────┴────────┐    │             │
     │                 │    │             │
     ▼                 ▼    ▼             ▼
┌─────────┐      ┌─────────────┐   ┌─────────────┐
│COMPLETED│      │   FAILED    │──▶│  REFUNDED   │
└─────────┘      └─────────────┘   └─────────────┘
```

### State Transitions

| From | To | Trigger |
|------|-----|---------|
| PENDING | PROCESSING | Gateway calls completeDecryption |
| PROCESSING | COMPLETED | Callback returns success |
| PROCESSING | FAILED | Callback returns failure |
| FAILED | REFUNDED | User claims refund |
| PENDING | FAILED | Timeout triggered |
| FAILED | REFUNDED | User claims refund |

## Data Flow

### Request Submission Flow

```
User                     PrivacyGateway              Callback Contract
  │                            │                            │
  │ submitDecryptionRequest()  │                            │
  │ ─────────────────────────▶ │                            │
  │                            │                            │
  │                            │ [Store request data]       │
  │                            │ [Set timeout]              │
  │                            │ [Emit RequestCreated]      │
  │                            │                            │
  │ ◀───────────── requestId   │                            │
  │                            │                            │
```

### Decryption Completion Flow

```
Gateway                  PrivacyGateway              Callback Contract
  │                            │                            │
  │ completeDecryption()       │                            │
  │ ─────────────────────────▶ │                            │
  │                            │                            │
  │                            │ onDecryptionComplete()     │
  │                            │ ─────────────────────────▶ │
  │                            │                            │
  │                            │ ◀───────────── success     │
  │                            │                            │
  │                            │ [Update status]            │
  │                            │ [Credit gateway balance]   │
  │                            │ [Emit DecryptionCompleted] │
  │                            │                            │
```

### Refund Flow

```
User                     PrivacyGateway
  │                            │
  │ claimRefund()              │
  │ ─────────────────────────▶ │
  │                            │
  │                            │ [Check eligibility]
  │                            │ [Update status]
  │                            │ [Transfer refund]
  │                            │ [Emit RefundProcessed]
  │                            │
  │ ◀───────────── refund ETH  │
  │                            │
```

## Privacy-Preserving Computation

### Division Privacy

The `privacyDivide` function prevents exact value inference:

```
Input: numerator, denominator, randomMultiplier

1. Scale both operands by randomMultiplier
   protectedNumerator = numerator × randomMultiplier
   protectedDenominator = denominator × randomMultiplier

2. Perform division
   result = protectedNumerator ÷ protectedDenominator

3. Add deterministic noise
   noise = hash(numerator, denominator, randomMultiplier) mod 256
   result = (result + noise) mod (result + 1)

Output: Obfuscated result
```

**Security Properties:**
- Same inputs with different multipliers yield different outputs
- Noise prevents exact reverse calculation
- Proportionality maintained for computation validity

### Price Obfuscation

The `obfuscatePrice` function hides prices:

```
Obfuscation:
1. XOR price with blinding factor
   temp = price ⊕ blindingFactor

2. Multiply with modular arithmetic
   obfuscated = (temp × blindingFactor) mod OBFUSCATION_PRIME

Revelation:
1. Reverse multiplication
   temp = obfuscated × modularInverse(blindingFactor)

2. Reverse XOR
   price = temp ⊕ blindingFactor
```

**Security Properties:**
- Only parties with blinding factor can reveal
- Wrong factor produces garbage output
- Computationally infeasible to brute-force

## Security Architecture

### Access Control Matrix

| Function | Owner | Gateway | Requester | Anyone |
|----------|-------|---------|-----------|--------|
| submitDecryptionRequest | ✓ | ✓ | ✓ | ✓ |
| completeDecryption | ✗ | ✓ | ✗ | ✗ |
| claimRefund | ✗ | ✗ | ✓ | ✗ |
| forceTimeout | ✓ | ✓ | ✓ | ✓ |
| approveGateway | ✓ | ✗ | ✗ | ✗ |
| revokeGateway | ✓ | ✗ | ✗ | ✗ |
| withdrawGatewayBalance | ✓ | ✓* | ✗ | ✗ |
| pause/unpause | ✓ | ✗ | ✗ | ✗ |

*Gateway can only withdraw own balance

### Reentrancy Protection

All external calls use ReentrancyGuard:
1. State changes before external calls where possible
2. Callback execution in try/catch blocks
3. Pull pattern for fund withdrawals

### Input Validation

| Parameter | Validation |
|-----------|------------|
| encryptedData | Length > 0 |
| callbackAddress | != address(0) |
| timeoutDuration | minTimeout ≤ x ≤ maxTimeout |
| msg.value | > 0 |
| randomMultiplier | 0 < x ≤ MAX_SAFE_MULTIPLIER |
| blindingFactor | > 0 |

## Deployment Architecture

### Network Topology

```
┌──────────────────────────────────────────────────────────┐
│                    Ethereum Network                       │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────┐    ┌──────────────┐    ┌────────────┐ │
│  │   Privacy    │    │   Privacy    │    │  Example   │ │
│  │   Gateway    │◀──▶│  Computation │◀──▶│  Privacy   │ │
│  │              │    │              │    │    DApp    │ │
│  └──────┬───────┘    └──────────────┘    └─────┬──────┘ │
│         │                                      │         │
└─────────┼──────────────────────────────────────┼─────────┘
          │                                      │
          │                                      │
┌─────────┴──────────────────────────────────────┴─────────┐
│                    Gateway Network                        │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐           │
│  │ Gateway  │    │ Gateway  │    │ Gateway  │           │
│  │    1     │    │    2     │    │    N     │           │
│  └──────────┘    └──────────┘    └──────────┘           │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

### Contract Dependencies

```
PrivacyGateway
├── @openzeppelin/Ownable
├── @openzeppelin/ReentrancyGuard
├── @openzeppelin/Pausable
└── IGatewayCallback (interface)

PrivacyComputation
└── IPrivacyComputation (interface)

ExamplePrivacyDApp
├── @openzeppelin/Ownable
├── @openzeppelin/ReentrancyGuard
├── IGatewayCallback
├── PrivacyGateway (reference)
└── PrivacyComputation (reference)
```

## Gas Optimization Strategies

### Storage Optimization

- Use events for non-critical data
- Pack struct fields efficiently
- Use bytes32 for request IDs

### Computation Optimization

- Pure functions for privacy computation
- Modular arithmetic in fixed-size operations
- Minimal state reads per transaction

### Call Optimization

- Batch operations where possible
- View functions for status checks
- External calls only when necessary
