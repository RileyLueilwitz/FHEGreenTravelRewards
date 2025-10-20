# Architecture Guide

Understanding the Universal FHEVM SDK architecture and design patterns.

## Table of Contents

- [Overview](#overview)
- [Three-Layer Architecture](#three-layer-architecture)
- [SDK Package Structure](#sdk-package-structure)
- [Design Patterns](#design-patterns)
- [Data Flow](#data-flow)
- [Security Model](#security-model)

---

## Overview

The Universal FHEVM SDK is designed with three core principles:

1. **Framework Agnostic** - Core functions work in any JavaScript environment
2. **Developer Friendly** - Simple, intuitive API inspired by wagmi
3. **Type Safe** - Full TypeScript support throughout

---

## Three-Layer Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    APPLICATION LAYER                         │
│  Your dApp (React, Vue, Next.js, or vanilla JS)            │
│  ├── Uses SDK hooks/utilities                               │
│  ├── No direct FHEVM dependency management                  │
│  └── Framework-specific adapters available                  │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                    UNIVERSAL SDK LAYER                       │
│  @fhevm/sdk - Framework-Agnostic Core                       │
│  ├── Core: createInstance, encrypt, decrypt                 │
│  ├── React: useFhevmInstance, useEncrypt, useDecrypt        │
│  ├── Vue: composables (optional)                            │
│  ├── Utils: EIP-712 signing, ACL management                 │
│  └── Types: Full TypeScript definitions                     │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                    FHEVM LAYER                               │
│  Zama's Official FHEVM Packages (wrapped by SDK)            │
│  ├── fhevmjs - Client-side encryption                       │
│  ├── Gateway - Decryption oracle                            │
│  └── TFHE operations                                         │
└─────────────────────────────────────────────────────────────┘
```

### Layer Responsibilities

**Application Layer:**
- User interface and interaction
- Wallet connection
- Transaction management
- Business logic

**SDK Layer:**
- FHEVM instance management
- Encryption/decryption abstraction
- Framework-specific hooks
- Type safety and validation

**FHEVM Layer:**
- Low-level FHE operations
- Network communication
- Cryptographic primitives

---

## SDK Package Structure

```
packages/fhevm-sdk/
│
├── src/
│   │
│   ├── core/                  # Framework-agnostic core
│   │   ├── instance.ts        # FHEVM instance management
│   │   ├── encrypt.ts         # Encryption utilities
│   │   ├── decrypt.ts         # Decryption utilities
│   │   └── types.ts           # TypeScript definitions
│   │
│   ├── react/                 # React-specific integration
│   │   ├── provider.tsx       # FhevmProvider component
│   │   └── hooks/
│   │       ├── useFhevmInstance.ts
│   │       ├── useEncrypt.ts
│   │       └── useDecrypt.ts
│   │
│   ├── utils/                 # Utility functions
│   │   ├── eip712.ts          # EIP-712 signature helpers
│   │   ├── acl.ts             # Access control utilities
│   │   └── validation.ts      # Input validation
│   │
│   └── index.ts               # Main exports
│
├── package.json
├── tsconfig.json
└── README.md
```

---

## Design Patterns

### 1. Singleton Pattern

FHEVM instance uses singleton pattern to avoid re-initialization:

```typescript
// instance.ts
let globalInstance: FhevmInstance | null = null

export async function createFhevmInstance(config: FhevmConfig): Promise<FhevmInstance> {
  if (globalInstance) {
    return globalInstance
  }

  // Initialize new instance
  globalInstance = await initializeFhevm(config)
  return globalInstance
}

export function getFhevmInstance(): FhevmInstance | null {
  return globalInstance
}
```

**Benefits:**
- Avoid expensive re-initialization
- Share instance across application
- Consistent state management

---

### 2. Provider Pattern (React)

React integration uses Context API for state management:

```typescript
// provider.tsx
export const FhevmContext = createContext<FhevmContextValue | null>(null)

export function FhevmProvider({ config, children }: FhevmProviderProps) {
  const [fhevm, setFhevm] = useState<FhevmInstance | null>(null)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    createFhevmInstance(config).then((instance) => {
      setFhevm(instance)
      setIsReady(true)
    })
  }, [config])

  return (
    <FhevmContext.Provider value={{ fhevm, isReady }}>
      {children}
    </FhevmContext.Provider>
  )
}
```

**Benefits:**
- Centralized state management
- Automatic initialization
- Easy access from any component

---

### 3. Hook Pattern

Custom hooks provide clean API for React components:

```typescript
// useEncrypt.ts
export function useEncrypt() {
  const { fhevm } = useFhevmInstance()
  const [isEncrypting, setIsEncrypting] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const encrypt = useCallback(async (value, type) => {
    if (!fhevm) throw new Error('FHEVM not ready')

    setIsEncrypting(true)
    setError(null)

    try {
      return await encryptCore(fhevm, value, type)
    } catch (err) {
      setError(err)
      throw err
    } finally {
      setIsEncrypting(false)
    }
  }, [fhevm])

  return { encrypt, isEncrypting, error }
}
```

**Benefits:**
- Automatic state management
- Error handling
- Loading states
- Reusable logic

---

### 4. Factory Pattern

Type-specific encryption uses factory pattern:

```typescript
// encrypt.ts
const encryptors = {
  uint8: (instance, value) => instance.encrypt_uint8(value),
  uint16: (instance, value) => instance.encrypt_uint16(value),
  uint32: (instance, value) => instance.encrypt_uint32(value),
  uint64: (instance, value) => instance.encrypt_uint64(value),
  bool: (instance, value) => instance.encrypt_bool(value),
  address: (instance, value) => instance.encrypt_address(value)
}

export async function encrypt(fhevm, value, type) {
  const encryptor = encryptors[type]
  if (!encryptor) throw new Error(`Invalid type: ${type}`)

  return encryptor(fhevm.instance, value)
}
```

**Benefits:**
- Type safety
- Easy to extend
- Clean separation

---

## Data Flow

### Encryption Flow

```
User Input
    │
    ▼
┌─────────────────┐
│ Validate Input  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ useEncrypt Hook │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Get FHEVM       │
│ Instance        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Core Encrypt    │
│ Function        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ fhevmjs Library │
└────────┬────────┘
         │
         ▼
  Encrypted Bytes
  (Uint8Array)
    │
    ▼
┌─────────────────┐
│ Submit to       │
│ Contract        │
└─────────────────┘
```

### Decryption Flow

```
Contract Call
    │
    ▼
┌─────────────────┐
│ useDecrypt Hook │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Get FHEVM       │
│ Instance        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Check ACL       │
│ Permissions     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Generate EIP712 │
│ Signature       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Request Gateway │
│ Decryption      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Core Decrypt    │
│ Function        │
└────────┬────────┘
         │
         ▼
  Decrypted Value
  (number/bool/string)
    │
    ▼
┌─────────────────┐
│ Return to UI    │
└─────────────────┘
```

---

## Security Model

### 1. Access Control

```typescript
// ACL-based permissions
┌──────────────┐
│ Smart        │
│ Contract     │◄────── Only authorized addresses
│ (Encrypted   │        can decrypt
│  Data)       │
└──────────────┘
       │
       │ ACL Check
       ▼
┌──────────────┐
│ Gateway      │
│ Oracle       │
└──────────────┘
       │
       │ Decryption
       ▼
  Plain Value
```

### 2. EIP-712 Signatures

User decryption requires EIP-712 signature:

```typescript
const domain = {
  name: 'FHEVM',
  version: '1',
  chainId: await provider.getNetwork().chainId,
  verifyingContract: contractAddress
}

const types = {
  Permit: [
    { name: 'userAddress', type: 'address' },
    { name: 'contractAddress', type: 'address' },
    { name: 'functionName', type: 'string' }
  ]
}

const signature = await signer._signTypedData(domain, types, message)
```

**Benefits:**
- Prevents unauthorized decryption
- User consent required
- Replay attack protection

### 3. Encryption Security

```
Client-Side Encryption
         │
         ▼
┌────────────────┐
│ Public Key     │
│ Encryption     │
└────────┬───────┘
         │
         ▼
┌────────────────┐
│ Encrypted      │
│ Bytes          │
└────────┬───────┘
         │
         ▼
┌────────────────┐
│ On-Chain       │
│ Storage        │
└────────────────┘
         │
         │ Always encrypted
         │ at rest and in transit
         ▼
```

---

## Performance Optimizations

### 1. Instance Caching

```typescript
// Single initialization
const fhevm = await createFhevmInstance(config)

// Reuse across operations
await encrypt(fhevm, value1, 'uint32')
await encrypt(fhevm, value2, 'uint32')
await encrypt(fhevm, value3, 'uint32')
```

### 2. Batch Operations

```typescript
// Batch encryption (parallel)
const encrypted = await encryptBatch(fhevm, [
  { value: 100, type: 'uint32' },
  { value: 200, type: 'uint32' },
  { value: 300, type: 'uint32' }
])
```

### 3. Lazy Loading

```typescript
// Provider loads instance only when needed
<FhevmProvider config={{ network: 'sepolia' }}>
  {/* Instance created on mount */}
  <App />
</FhevmProvider>
```

---

## Extension Points

### Adding New Framework Support

```typescript
// packages/fhevm-sdk/src/vue/composables.ts
import { ref, onMounted } from 'vue'
import { createFhevmInstance, encrypt as encryptCore } from '../core'

export function useFhevm(config) {
  const fhevm = ref(null)
  const isReady = ref(false)

  onMounted(async () => {
    fhevm.value = await createFhevmInstance(config)
    isReady.value = true
  })

  return { fhevm, isReady }
}

export function useEncrypt() {
  const { fhevm } = useFhevm()

  const encrypt = async (value, type) => {
    return encryptCore(fhevm.value, value, type)
  }

  return { encrypt }
}
```

### Adding New Encryption Types

```typescript
// core/encrypt.ts
const encryptors = {
  // Existing types...
  uint8: (instance, value) => instance.encrypt_uint8(value),

  // New type
  uint128: (instance, value) => instance.encrypt_uint128(value)
}
```

---

## Best Practices

### 1. Separation of Concerns

```
Application Logic  →  SDK Hooks  →  Core Functions  →  fhevmjs
```

Each layer has single responsibility.

### 2. Type Safety

```typescript
// Always use TypeScript
const encrypted: Uint8Array = await encrypt(fhevm, 42, 'uint32')

// Validate at runtime
if (typeof value !== 'number') {
  throw new Error('Value must be number')
}
```

### 3. Error Handling

```typescript
try {
  const encrypted = await encrypt(fhevm, value, type)
} catch (error) {
  // Handle gracefully
  console.error('Encryption failed:', error)
  showErrorToUser(error.message)
}
```

---

## Resources

- **SDK Documentation**: [SDK_DOCUMENTATION.md](./SDK_DOCUMENTATION.md)
- **Quick Start**: [QUICK_START.md](./QUICK_START.md)
- **Integration Guide**: [INTEGRATION.md](./INTEGRATION.md)
- **GitHub**: https://github.com/RileyLueilwitz/fhevm-react-template
