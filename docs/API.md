# API Reference Documentation

## PrivacyGateway Contract API

### Public Functions

#### submitDecryptionRequest

Submits an encrypted request for decryption by approved gateways.

**Function Signature:**
```solidity
function submitDecryptionRequest(
    bytes calldata encryptedData,
    address callbackAddress,
    uint256 timeoutDuration
) external payable nonReentrant whenNotPaused returns (bytes32)
```

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `encryptedData` | bytes | Encrypted data requiring decryption |
| `callbackAddress` | address | Contract address receiving callback |
| `timeoutDuration` | uint256 | Custom timeout (0 = default 24 hours) |

**Returns:**
- `bytes32`: Unique request identifier

**Modifiers:**
- `nonReentrant`: Prevents reentrancy attacks
- `whenNotPaused`: Prevents calls when contract is paused

**Requirements:**
- `msg.value > 0` - Must send ETH for request
- `callbackAddress != address(0)` - Valid callback address required
- `encryptedData.length > 0` - Non-empty encrypted data required
- Timeout must be between minTimeout and maxTimeout

**Events:**
```solidity
event RequestCreated(
    bytes32 indexed requestId,
    address indexed requester,
    uint256 amount,
    uint256 timestamp
)
```

**Example:**
```solidity
bytes memory encrypted = abi.encodePacked(data);
bytes32 requestId = gateway.submitDecryptionRequest{value: 1 ether}(
    encrypted,
    callbackContract,
    0  // Use default timeout
);
```

---

#### completeDecryption

Gateway completes decryption and triggers callback.

**Function Signature:**
```solidity
function completeDecryption(
    bytes32 requestId,
    bytes calldata decryptedData
) external onlyGateway requestExists(requestId) nonReentrant
```

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `requestId` | bytes32 | The request to complete |
| `decryptedData` | bytes | Successfully decrypted data |

**Modifiers:**
- `onlyGateway`: Only approved gateways can call
- `requestExists`: Request must exist
- `nonReentrant`: Prevents reentrancy

**Requirements:**
- Request must be in PENDING state
- Request must not have timed out
- Caller must be approved gateway

**Events:**
```solidity
event DecryptionCompleted(
    bytes32 indexed requestId,
    address indexed gateway,
    bytes encryptedData,
    bool success
)
event DecryptionFailed(
    bytes32 indexed requestId,
    address indexed gateway,
    string reason
)
```

**Example:**
```solidity
bytes memory decrypted = decrypt(requestId); // Off-chain decryption
gateway.completeDecryption(requestId, decrypted);
```

---

#### claimRefund

User claims refund for failed or timed-out request.

**Function Signature:**
```solidity
function claimRefund(bytes32 requestId)
external onlyRequester(requestId) requestExists(requestId) nonReentrant
```

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `requestId` | bytes32 | The request to refund |

**Modifiers:**
- `onlyRequester`: Only the requester can call
- `requestExists`: Request must exist
- `nonReentrant`: Prevents reentrancy

**Requirements:**
- Request must not be completed
- Request must not already be refunded
- Request must be failed or timed out

**Events:**
```solidity
event RefundProcessed(
    bytes32 indexed requestId,
    address indexed requester,
    uint256 amount
)
```

**Example:**
```solidity
gateway.claimRefund(requestId);
```

---

#### forceTimeout

Manually timeout an expired request.

**Function Signature:**
```solidity
function forceTimeout(bytes32 requestId)
external requestExists(requestId) nonReentrant
```

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `requestId` | bytes32 | The request to timeout |

**Modifiers:**
- `requestExists`: Request must exist
- `nonReentrant`: Prevents reentrancy

**Requirements:**
- Request must have actually timed out
- Request must be pending or processing

**Events:**
```solidity
event TimeoutActivated(
    bytes32 indexed requestId,
    address indexed requester
)
```

---

### Gateway Management Functions

#### approveGateway

Owner approves a new gateway node.

**Function Signature:**
```solidity
function approveGateway(address gateway) external onlyOwner
```

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `gateway` | address | Gateway address to approve |

**Requirements:**
- Caller must be contract owner
- Gateway must not already be approved

**Events:**
```solidity
event GatewayApproved(address indexed gateway)
```

---

#### revokeGateway

Owner revokes gateway approval.

**Function Signature:**
```solidity
function revokeGateway(address gateway) external onlyOwner
```

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `gateway` | address | Gateway address to revoke |

**Requirements:**
- Caller must be contract owner
- Gateway must be currently approved

**Events:**
```solidity
event GatewayRevoked(address indexed gateway)
```

---

#### withdrawGatewayBalance

Gateway or owner withdraws accumulated balance.

**Function Signature:**
```solidity
function withdrawGatewayBalance(address gateway)
external nonReentrant
```

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `gateway` | address | Gateway address to withdraw for |

**Requirements:**
- Caller must be the gateway or owner
- Balance must be > 0

**Events:**
Emits standard ETH transfer

---

### Configuration Functions

#### setDefaultTimeout

Update default timeout duration.

**Function Signature:**
```solidity
function setDefaultTimeout(uint256 newDuration) external onlyOwner
```

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `newDuration` | uint256 | New timeout in seconds |

**Requirements:**
- Duration must be between minTimeout and maxTimeout

---

#### setTimeoutConstraints

Update timeout bounds.

**Function Signature:**
```solidity
function setTimeoutConstraints(uint256 newMin, uint256 newMax)
external onlyOwner
```

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `newMin` | uint256 | Minimum timeout in seconds |
| `newMax` | uint256 | Maximum timeout in seconds |

**Requirements:**
- newMin > 0
- newMax > newMin

---

### View Functions

#### getRequest

Get full request details.

**Function Signature:**
```solidity
function getRequest(bytes32 requestId)
external view requestExists(requestId)
returns (DecryptionRequest memory)
```

**Returns:**
```solidity
struct DecryptionRequest {
    address requester;
    uint256 amount;
    bytes encryptedData;
    RequestStatus status;
    uint256 createdAt;
    uint256 timeoutDuration;
    address callback;
}
```

---

#### getRequestStatus

Get current request status.

**Function Signature:**
```solidity
function getRequestStatus(bytes32 requestId)
external view requestExists(requestId)
returns (RequestStatus)
```

**Returns:**
```solidity
enum RequestStatus {
    PENDING,      // 0
    PROCESSING,   // 1
    COMPLETED,    // 2
    FAILED,       // 3
    REFUNDED      // 4
}
```

---

#### isRequestTimedOut

Check if request has timed out.

**Function Signature:**
```solidity
function isRequestTimedOut(bytes32 requestId)
public view requestExists(requestId)
returns (bool)
```

**Returns:**
- `true` if `block.timestamp > createdAt + timeoutDuration`
- `false` otherwise

---

#### getApprovedGateways

Get all approved gateway addresses.

**Function Signature:**
```solidity
function getApprovedGateways()
external view
returns (address[] memory)
```

**Returns:**
- Array of approved gateway addresses

---

#### getGatewayBalance

Get gateway's accumulated balance.

**Function Signature:**
```solidity
function getGatewayBalance(address gateway)
external view
returns (uint256)
```

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `gateway` | address | Gateway address |

**Returns:**
- Accumulated balance in wei

---

## PrivacyComputation Contract API

### Privacy Functions

#### privacyDivide

Perform division with privacy protection.

**Function Signature:**
```solidity
function privacyDivide(
    uint256 numerator,
    uint256 denominator,
    uint256 randomMultiplier
) external pure returns (uint256)
```

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `numerator` | uint256 | The dividend |
| `denominator` | uint256 | The divisor |
| `randomMultiplier` | uint256 | Privacy multiplier (should be random) |

**Returns:**
- `uint256`: Obfuscated division result

**Requirements:**
- `denominator != 0`
- `randomMultiplier > 0`
- `randomMultiplier <= 2^64`

**Notes:**
- Different multipliers produce different results
- Results are consistent for same inputs
- Proportionality is maintained

---

#### obfuscatePrice

Hide price value with blinding factor.

**Function Signature:**
```solidity
function obfuscatePrice(
    uint256 price,
    uint256 blindingFactor
) external pure returns (uint256)
```

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `price` | uint256 | The price to obfuscate |
| `blindingFactor` | uint256 | Secret blinding factor |

**Returns:**
- `uint256`: Obfuscated price

**Requirements:**
- `price > 0`
- `blindingFactor > 0`

**Notes:**
- Only parties with correct factor can reveal
- Same price with different factors produces different results

---

#### revealObfuscatedValue

Recover original price with correct factor.

**Function Signature:**
```solidity
function revealObfuscatedValue(
    uint256 obfuscatedValue,
    uint256 blindingFactor
) external pure returns (uint256)
```

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `obfuscatedValue` | uint256 | The obfuscated price |
| `blindingFactor` | uint256 | The correct blinding factor |

**Returns:**
- `uint256`: Revealed original price

**Notes:**
- Must use exact same factor as obfuscation
- Wrong factor produces garbage output

---

### Safety Functions

#### isWithinSafeBounds

Check if value is within safe computation bounds.

**Function Signature:**
```solidity
function isWithinSafeBounds(uint256 value)
external pure returns (bool)
```

**Returns:**
- `true` if `0 < value <= type(uint256).max / 2`

---

#### safeMultiply

Safely multiply with overflow protection.

**Function Signature:**
```solidity
function safeMultiply(uint256 a, uint256 b)
external pure returns (uint256)
```

**Returns:**
- Product if no overflow
- Reverts with "Multiplication overflow" if overflow

---

#### safeAdd

Safely add with overflow protection.

**Function Signature:**
```solidity
function safeAdd(uint256 a, uint256 b)
external pure returns (uint256)
```

**Returns:**
- Sum if no overflow
- Reverts with "Addition overflow" if overflow

---

## IGatewayCallback Interface

### onDecryptionComplete

Called by PrivacyGateway when decryption is complete.

**Function Signature:**
```solidity
function onDecryptionComplete(
    bytes32 requestId,
    address requester,
    bytes calldata encryptedData,
    bytes calldata decryptedData
) external returns (bool)
```

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `requestId` | bytes32 | Unique request identifier |
| `requester` | address | Original requester address |
| `encryptedData` | bytes | Original encrypted data |
| `decryptedData` | bytes | Successfully decrypted data |

**Returns:**
- `true` if processing was successful
- `false` if processing failed

**Implementation Notes:**
- Should revert or return false on invalid data
- Is called during a transaction, not asynchronously
- Exceptions are caught and trigger refund

---

## Events Reference

### PrivacyGateway Events

```solidity
event RequestCreated(
    bytes32 indexed requestId,
    address indexed requester,
    uint256 amount,
    uint256 timestamp
)

event DecryptionCompleted(
    bytes32 indexed requestId,
    address indexed gateway,
    bytes encryptedData,
    bool success
)

event DecryptionFailed(
    bytes32 indexed requestId,
    address indexed gateway,
    string reason
)

event RefundProcessed(
    bytes32 indexed requestId,
    address indexed requester,
    uint256 amount
)

event TimeoutActivated(
    bytes32 indexed requestId,
    address indexed requester
)

event GatewayApproved(address indexed gateway)

event GatewayRevoked(address indexed gateway)
```

---

## Common Patterns

### Submitting an Encrypted Request

```solidity
// 1. Prepare encrypted data
bytes memory encrypted = abi.encodePacked(
    encryptedAmount,
    encryptedPrice
);

// 2. Submit request
bytes32 requestId = gateway.submitDecryptionRequest{value: 1 ether}(
    encrypted,
    address(this),  // This contract receives callback
    0               // Use default timeout
);

// 3. Implement IGatewayCallback for callback handling
function onDecryptionComplete(
    bytes32 requestId,
    address requester,
    bytes calldata encryptedData,
    bytes calldata decryptedData
) external override returns (bool) {
    // Process decrypted data
    return true;
}
```

### Obfuscating and Revealing Prices

```solidity
// 1. Generate random blinding factor
uint256 blindingFactor = uint256(keccak256(abi.encodePacked(
    msg.sender,
    block.timestamp
)));

// 2. Obfuscate price
uint256 obfuscated = computation.obfuscatePrice(price, blindingFactor);

// 3. Store obfuscated price on-chain
// ...

// 4. Later, reveal with factor (only authorized party)
uint256 revealed = computation.revealObfuscatedValue(
    obfuscated,
    blindingFactor
);
```

### Safe Arithmetic Operations

```solidity
// Check bounds
require(computation.isWithinSafeBounds(value), "Value out of bounds");

// Safe multiplication
uint256 result = computation.safeMultiply(a, b);

// Safe addition
uint256 sum = computation.safeAdd(x, y);
```

---

## Error Handling

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `Division by zero` | denominator = 0 | Ensure denominator > 0 |
| `Invalid multiplier` | multiplier = 0 or > 2^64 | Use valid random multiplier |
| `Only requester can call` | Wrong caller for claimRefund | Call with requester address |
| `Only approved gateway` | Gateway not approved | Call approveGateway first |
| `Request does not exist` | Invalid requestId | Verify requestId is correct |
| `Request not pending` | Request in wrong state | Check request status first |
| `Multiplication overflow` | a × b too large | Check value bounds |
| `Pausable: paused` | Contract is paused | Wait for unpause |

---
