# Universal FHEVM SDK Documentation

Complete API reference for the Universal FHEVM SDK.

## Table of Contents

- [Installation](#installation)
- [Core Functions](#core-functions)
- [React Hooks](#react-hooks)
- [Utility Functions](#utility-functions)
- [Type Definitions](#type-definitions)
- [Error Handling](#error-handling)

---

## Installation

```bash
npm install @fhevm/sdk ethers
```

---

## Core Functions

### createFhevmInstance

Initialize an FHEVM instance for encryption and decryption operations.

**Signature:**
```typescript
async function createFhevmInstance(config: FhevmConfig): Promise<FhevmInstance>
```

**Parameters:**
```typescript
interface FhevmConfig {
  network: 'sepolia' | 'local' | 'mainnet'
  gatewayUrl?: string
  contractAddress?: string
  aclAddress?: string
  publicKey?: string
}
```

**Returns:**
```typescript
interface FhevmInstance {
  instance: any
  publicKey: string
  network: string
  contractAddress?: string
  aclAddress?: string
}
```

**Example:**
```typescript
import { createFhevmInstance } from '@fhevm/sdk'

const fhevm = await createFhevmInstance({
  network: 'sepolia',
  gatewayUrl: 'https://gateway.sepolia.zama.ai',
  contractAddress: '0x...',
  aclAddress: '0x...'
})
```

---

### encrypt

Encrypt data for submission to smart contracts.

**Signature:**
```typescript
async function encrypt(
  fhevm: FhevmInstance,
  value: number | boolean | string,
  type: EncryptionType
): Promise<Uint8Array>
```

**Supported Types:**
- `uint8` - 8-bit unsigned integer (0 to 255)
- `uint16` - 16-bit unsigned integer (0 to 65,535)
- `uint32` - 32-bit unsigned integer (0 to 4,294,967,295)
- `uint64` - 64-bit unsigned integer
- `bool` - Boolean value
- `address` - Ethereum address

**Example:**
```typescript
import { encrypt } from '@fhevm/sdk'

// Encrypt different types
const encrypted8 = await encrypt(fhevm, 255, 'uint8')
const encrypted32 = await encrypt(fhevm, 1000000, 'uint32')
const encryptedBool = await encrypt(fhevm, true, 'bool')
const encryptedAddr = await encrypt(fhevm, '0x1234...', 'address')
```

---

### encryptBatch

Encrypt multiple values at once.

**Signature:**
```typescript
async function encryptBatch(
  fhevm: FhevmInstance,
  values: Array<{ value: number | boolean | string; type: EncryptionType }>
): Promise<Uint8Array[]>
```

**Example:**
```typescript
import { encryptBatch } from '@fhevm/sdk'

const encrypted = await encryptBatch(fhevm, [
  { value: 100, type: 'uint32' },
  { value: true, type: 'bool' },
  { value: '0x...', type: 'address' }
])
```

---

### decrypt

Decrypt data from smart contracts.

**Signature:**
```typescript
async function decrypt(
  fhevm: FhevmInstance,
  contract: Contract,
  method: string,
  options?: DecryptOptions
): Promise<number | boolean | string>
```

**Options:**
```typescript
interface DecryptOptions {
  signature?: string        // EIP-712 signature for user decrypt
  publicKey?: string       // Public key for verification
  userAddress?: string     // User address for ACL check
}
```

**Example:**
```typescript
import { decrypt } from '@fhevm/sdk'
import { ethers } from 'ethers'

const contract = new ethers.Contract(address, abi, signer)

// Public decrypt (oracle-based)
const result = await decrypt(fhevm, contract, 'getPublicValue')

// User decrypt (requires signature)
const signature = await signEIP712(signer, {
  contractAddress: contract.address,
  functionName: 'getPrivateValue',
  userAddress: signer.address
})

const privateResult = await decrypt(fhevm, contract, 'getPrivateValue', {
  signature,
  publicKey: fhevm.publicKey,
  userAddress: signer.address
})
```

---

### getFhevmInstance

Get the current FHEVM instance (singleton pattern).

**Signature:**
```typescript
function getFhevmInstance(): FhevmInstance | null
```

**Example:**
```typescript
import { getFhevmInstance } from '@fhevm/sdk'

const fhevm = getFhevmInstance()
if (fhevm) {
  console.log('FHEVM is initialized')
}
```

---

### resetFhevmInstance

Reset the FHEVM instance.

**Signature:**
```typescript
function resetFhevmInstance(): void
```

**Example:**
```typescript
import { resetFhevmInstance } from '@fhevm/sdk'

resetFhevmInstance()
// Instance will need to be recreated
```

---

## React Hooks

### FhevmProvider

Context provider for FHEVM instance.

**Props:**
```typescript
interface FhevmProviderProps {
  config: FhevmConfig
  children: ReactNode
}
```

**Example:**
```typescript
import { FhevmProvider } from '@fhevm/sdk/react'

function App() {
  return (
    <FhevmProvider config={{ network: 'sepolia' }}>
      <YourComponents />
    </FhevmProvider>
  )
}
```

---

### useFhevmInstance

Access FHEVM instance in React components.

**Signature:**
```typescript
function useFhevmInstance(): {
  fhevm: FhevmInstance | null
  isReady: boolean
  error: Error | null
}
```

**Example:**
```typescript
import { useFhevmInstance } from '@fhevm/sdk/react'

function MyComponent() {
  const { fhevm, isReady, error } = useFhevmInstance()

  if (!isReady) return <div>Loading FHEVM...</div>
  if (error) return <div>Error: {error.message}</div>

  return <div>FHEVM Ready: {fhevm.publicKey.substring(0, 20)}...</div>
}
```

---

### useEncrypt

Hook for encrypting data.

**Signature:**
```typescript
function useEncrypt(): {
  encrypt: (value: number | boolean | string, type: EncryptionType) => Promise<Uint8Array>
  isEncrypting: boolean
  error: Error | null
}
```

**Example:**
```typescript
import { useEncrypt } from '@fhevm/sdk/react'

function SubmitData() {
  const { encrypt, isEncrypting, error } = useEncrypt()

  const handleSubmit = async (value: number) => {
    try {
      const encrypted = await encrypt(value, 'uint32')
      await contract.submitData(encrypted)
    } catch (err) {
      console.error('Encryption failed:', err)
    }
  }

  return (
    <button onClick={() => handleSubmit(42)} disabled={isEncrypting}>
      {isEncrypting ? 'Encrypting...' : 'Submit'}
    </button>
  )
}
```

---

### useDecrypt

Hook for decrypting data.

**Signature:**
```typescript
function useDecrypt(): {
  decrypt: (contract: Contract, method: string, options?: DecryptOptions) => Promise<any>
  isDecrypting: boolean
  result: any
  error: Error | null
}
```

**Example:**
```typescript
import { useDecrypt } from '@fhevm/sdk/react'

function ViewData() {
  const { decrypt, isDecrypting, result, error } = useDecrypt()

  const handleDecrypt = async () => {
    try {
      const data = await decrypt(contract, 'getData')
      console.log('Decrypted:', data)
    } catch (err) {
      console.error('Decryption failed:', err)
    }
  }

  return (
    <div>
      <button onClick={handleDecrypt} disabled={isDecrypting}>
        {isDecrypting ? 'Decrypting...' : 'View Data'}
      </button>
      {result && <p>Result: {result}</p>}
    </div>
  )
}
```

---

## Utility Functions

### signEIP712

Generate EIP-712 signature for user decryption.

**Signature:**
```typescript
async function signEIP712(
  signer: Signer,
  params: {
    contractAddress: string
    functionName: string
    userAddress: string
  }
): Promise<string>
```

**Example:**
```typescript
import { signEIP712 } from '@fhevm/sdk/utils'

const signature = await signEIP712(signer, {
  contractAddress: '0x...',
  functionName: 'getPrivateData',
  userAddress: await signer.getAddress()
})
```

---

### grantAccess

Grant decryption access to another address.

**Signature:**
```typescript
async function grantAccess(
  fhevm: FhevmInstance,
  contract: Contract,
  address: string,
  method: string
): Promise<void>
```

**Example:**
```typescript
import { grantAccess } from '@fhevm/sdk/utils'

await grantAccess(fhevm, contract, '0x...', 'getData')
```

---

### revokeAccess

Revoke decryption access from an address.

**Signature:**
```typescript
async function revokeAccess(
  fhevm: FhevmInstance,
  contract: Contract,
  address: string,
  method: string
): Promise<void>
```

---

### checkAccess

Check if an address has decryption permission.

**Signature:**
```typescript
async function checkAccess(
  fhevm: FhevmInstance,
  contract: Contract,
  address: string,
  method: string
): Promise<boolean>
```

**Example:**
```typescript
import { checkAccess } from '@fhevm/sdk/utils'

const hasAccess = await checkAccess(fhevm, contract, '0x...', 'getData')
if (hasAccess) {
  console.log('Address has access')
}
```

---

## Type Definitions

```typescript
// Encryption types
type EncryptionType = 'uint8' | 'uint16' | 'uint32' | 'uint64' | 'bool' | 'address'

// Network types
type Network = 'sepolia' | 'local' | 'mainnet'

// FHEVM configuration
interface FhevmConfig {
  network: Network
  gatewayUrl?: string
  contractAddress?: string
  aclAddress?: string
  publicKey?: string
}

// FHEVM instance
interface FhevmInstance {
  instance: any
  publicKey: string
  network: string
  contractAddress?: string
  aclAddress?: string
}

// Decryption options
interface DecryptOptions {
  signature?: string
  publicKey?: string
  userAddress?: string
}
```

---

## Error Handling

The SDK throws descriptive errors that should be caught and handled:

```typescript
import { createFhevmInstance, encrypt } from '@fhevm/sdk'

try {
  const fhevm = await createFhevmInstance({ network: 'sepolia' })
  const encrypted = await encrypt(fhevm, 42, 'uint32')
} catch (error) {
  if (error instanceof Error) {
    console.error('SDK Error:', error.message)

    // Handle specific errors
    if (error.message.includes('network')) {
      console.error('Network configuration error')
    } else if (error.message.includes('encryption')) {
      console.error('Encryption failed')
    }
  }
}
```

**Common Errors:**
- `FHEVM instance not initialized` - Call createFhevmInstance first
- `Invalid encryption type` - Use supported type (uint8, uint16, uint32, uint64, bool, address)
- `Contract address required` - Provide contract address in config
- `Signature required for user decrypt` - Include EIP-712 signature

---

## Best Practices

### 1. Initialize Once

```typescript
// ✅ Good - Initialize at app start
const fhevm = await createFhevmInstance({ network: 'sepolia' })

// ❌ Bad - Don't reinitialize on every operation
async function encrypt(value) {
  const fhevm = await createFhevmInstance({ network: 'sepolia' }) // Slow!
  return encrypt(fhevm, value, 'uint32')
}
```

### 2. Use React Provider

```typescript
// ✅ Good - Use provider for React apps
<FhevmProvider config={{ network: 'sepolia' }}>
  <App />
</FhevmProvider>

// ❌ Bad - Don't manage instance manually in each component
```

### 3. Handle Loading States

```typescript
// ✅ Good - Show loading UI
const { fhevm, isReady } = useFhevmInstance()
if (!isReady) return <Spinner />

// ❌ Bad - Assume instant readiness
const { fhevm } = useFhevmInstance()
encrypt(fhevm, 42, 'uint32') // May fail if not ready
```

### 4. Type Safety

```typescript
// ✅ Good - Use TypeScript
const encrypted: Uint8Array = await encrypt(fhevm, 42, 'uint32')

// ✅ Good - Validate values
const value = Math.min(Math.max(input, 0), 4294967295)
await encrypt(fhevm, value, 'uint32')
```

---

## Support

- GitHub: https://github.com/RileyLueilwitz/fhevm-react-template
- Documentation: https://docs.zama.ai
- Issues: https://github.com/RileyLueilwitz/fhevm-react-template/issues
