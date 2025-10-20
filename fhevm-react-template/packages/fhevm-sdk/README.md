# @fhevm/sdk

**Universal FHEVM SDK for building confidential frontends**

Framework-agnostic SDK that wraps all necessary FHEVM packages and provides a wagmi-like API for privacy-preserving decentralized applications.

## Installation

```bash
npm install @fhevm/sdk ethers
```

## Quick Start

### Framework-Agnostic (Core)

```typescript
import { createFhevmInstance, encrypt, decrypt } from '@fhevm/sdk'

// Initialize
const fhevm = await createFhevmInstance({
  network: 'sepolia',
  gatewayUrl: 'https://gateway.sepolia.zama.ai'
})

// Encrypt
const encrypted = await encrypt(fhevm, 42, 'uint32')

// Decrypt
const decrypted = await decrypt(fhevm, contract, 'getData')
```

### React

```typescript
import { FhevmProvider, useEncrypt, useDecrypt } from '@fhevm/sdk/react'

function App() {
  return (
    <FhevmProvider config={{ network: 'sepolia' }}>
      <YourComponents />
    </FhevmProvider>
  )
}

function Component() {
  const { encrypt } = useEncrypt()
  const { decrypt } = useDecrypt()

  const handleSubmit = async (value) => {
    const encrypted = await encrypt(value, 'uint32')
    await contract.submitData(encrypted)
  }

  return <button onClick={() => handleSubmit(42)}>Submit</button>
}
```

## Features

- ✅ Framework-agnostic core
- ✅ React hooks (wagmi-like API)
- ✅ TypeScript support
- ✅ Minimal boilerplate (<10 lines)
- ✅ EIP-712 signature support
- ✅ ACL management utilities

## Documentation

See main README for complete documentation and examples.

## License

MIT
