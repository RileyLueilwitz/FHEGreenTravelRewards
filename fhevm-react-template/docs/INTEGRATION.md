# Integration Guide

Framework-specific integration examples for Universal FHEVM SDK.

## Table of Contents

- [React Integration](#react-integration)
- [Next.js Integration](#nextjs-integration)
- [Vue 3 Integration](#vue-3-integration)
- [Node.js Integration](#nodejs-integration)
- [TypeScript Configuration](#typescript-configuration)
- [Testing Integration](#testing-integration)

---

## React Integration

### Basic Setup

```bash
npm install @fhevm/sdk ethers react
```

### App Entry Point

```jsx
// index.jsx or main.jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { FhevmProvider } from '@fhevm/sdk/react'
import App from './App'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <FhevmProvider config={{ network: 'sepolia' }}>
      <App />
    </FhevmProvider>
  </React.StrictMode>
)
```

### Using Hooks in Components

```jsx
// components/SubmitData.jsx
import { useState } from 'react'
import { useFhevmInstance, useEncrypt } from '@fhevm/sdk/react'
import { ethers } from 'ethers'

function SubmitData() {
  const { fhevm, isReady } = useFhevmInstance()
  const { encrypt, isEncrypting } = useEncrypt()
  const [value, setValue] = useState(0)
  const [status, setStatus] = useState('')

  const handleSubmit = async () => {
    try {
      setStatus('Encrypting...')
      const encrypted = await encrypt(value, 'uint32')

      setStatus('Submitting...')
      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()
      const contract = new ethers.Contract(contractAddress, abi, signer)

      const tx = await contract.submitData(encrypted)
      await tx.wait()

      setStatus('Success!')
    } catch (error) {
      setStatus(`Error: ${error.message}`)
    }
  }

  if (!isReady) {
    return <div>Loading FHEVM...</div>
  }

  return (
    <div>
      <input
        type="number"
        value={value}
        onChange={(e) => setValue(Number(e.target.value))}
      />
      <button onClick={handleSubmit} disabled={isEncrypting}>
        {isEncrypting ? 'Encrypting...' : 'Submit'}
      </button>
      <p>{status}</p>
    </div>
  )
}

export default SubmitData
```

### Custom Hook Example

```jsx
// hooks/useContract.js
import { useMemo } from 'react'
import { ethers } from 'ethers'
import { useEncrypt, useDecrypt } from '@fhevm/sdk/react'

export function useContract(address, abi) {
  const { encrypt } = useEncrypt()
  const { decrypt } = useDecrypt()

  const contract = useMemo(() => {
    if (!window.ethereum) return null
    const provider = new ethers.BrowserProvider(window.ethereum)
    return new ethers.Contract(address, abi, provider)
  }, [address, abi])

  const submitEncrypted = async (method, value, type = 'uint32') => {
    const signer = await contract.runner.provider.getSigner()
    const contractWithSigner = contract.connect(signer)

    const encrypted = await encrypt(value, type)
    const tx = await contractWithSigner[method](encrypted)
    return tx.wait()
  }

  const queryDecrypted = async (method) => {
    return decrypt(contract, method)
  }

  return { contract, submitEncrypted, queryDecrypted }
}
```

---

## Next.js Integration

### App Router (Next.js 13+)

```bash
npm install @fhevm/sdk ethers next react
```

### Root Layout

```jsx
// app/layout.jsx
import { FhevmProvider } from '@fhevm/sdk/react'

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <FhevmProvider config={{ network: 'sepolia' }}>
          {children}
        </FhevmProvider>
      </body>
    </html>
  )
}
```

### Pages Router (Next.js 12 and below)

```jsx
// pages/_app.jsx
import { FhevmProvider } from '@fhevm/sdk/react'

export default function App({ Component, pageProps }) {
  return (
    <FhevmProvider config={{ network: 'sepolia' }}>
      <Component {...pageProps} />
    </FhevmProvider>
  )
}
```

### Client Component

```jsx
// app/submit/page.jsx
'use client'

import { useFhevmInstance, useEncrypt } from '@fhevm/sdk/react'

export default function SubmitPage() {
  const { fhevm, isReady } = useFhevmInstance()
  const { encrypt } = useEncrypt()

  const handleSubmit = async (value) => {
    const encrypted = await encrypt(value, 'uint32')
    // Submit to contract...
  }

  return (
    <div>
      <h1>Submit Encrypted Data</h1>
      {isReady ? (
        <button onClick={() => handleSubmit(42)}>Submit</button>
      ) : (
        <p>Loading...</p>
      )}
    </div>
  )
}
```

### API Route Example

```javascript
// app/api/encrypt/route.js
import { createFhevmInstance, encrypt } from '@fhevm/sdk'

export async function POST(request) {
  const { value, type } = await request.json()

  try {
    const fhevm = await createFhevmInstance({ network: 'sepolia' })
    const encrypted = await encrypt(fhevm, value, type)

    return Response.json({
      success: true,
      encrypted: Array.from(encrypted)
    })
  } catch (error) {
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
```

---

## Vue 3 Integration

### Create Vue Composables

```bash
npm install @fhevm/sdk ethers vue
```

### Composables File

```javascript
// composables/useFhevm.js
import { ref, onMounted } from 'vue'
import { createFhevmInstance, encrypt as encryptCore, decrypt as decryptCore } from '@fhevm/sdk'

export function useFhevm(config = { network: 'sepolia' }) {
  const fhevm = ref(null)
  const isReady = ref(false)
  const error = ref(null)

  onMounted(async () => {
    try {
      fhevm.value = await createFhevmInstance(config)
      isReady.value = true
    } catch (err) {
      error.value = err
    }
  })

  return { fhevm, isReady, error }
}

export function useEncrypt() {
  const { fhevm, isReady } = useFhevm()
  const isEncrypting = ref(false)
  const error = ref(null)

  const encrypt = async (value, type) => {
    if (!fhevm.value) {
      throw new Error('FHEVM not initialized')
    }

    isEncrypting.value = true
    error.value = null

    try {
      return await encryptCore(fhevm.value, value, type)
    } catch (err) {
      error.value = err
      throw err
    } finally {
      isEncrypting.value = false
    }
  }

  return { encrypt, isEncrypting, error, isReady }
}

export function useDecrypt() {
  const { fhevm } = useFhevm()
  const isDecrypting = ref(false)
  const result = ref(null)
  const error = ref(null)

  const decrypt = async (contract, method, options) => {
    if (!fhevm.value) {
      throw new Error('FHEVM not initialized')
    }

    isDecrypting.value = true
    error.value = null

    try {
      const data = await decryptCore(fhevm.value, contract, method, options)
      result.value = data
      return data
    } catch (err) {
      error.value = err
      throw err
    } finally {
      isDecrypting.value = false
    }
  }

  return { decrypt, isDecrypting, result, error }
}
```

### Component Usage

```vue
<!-- components/SubmitData.vue -->
<template>
  <div>
    <div v-if="!isReady">Loading FHEVM...</div>
    <div v-else>
      <input v-model.number="value" type="number" />
      <button @click="handleSubmit" :disabled="isEncrypting">
        {{ isEncrypting ? 'Encrypting...' : 'Submit' }}
      </button>
      <p v-if="status">{{ status }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useEncrypt } from '@/composables/useFhevm'

const { encrypt, isEncrypting, isReady } = useEncrypt()
const value = ref(0)
const status = ref('')

const handleSubmit = async () => {
  try {
    status.value = 'Encrypting...'
    const encrypted = await encrypt(value.value, 'uint32')

    status.value = 'Submitting...'
    // Submit to contract...

    status.value = 'Success!'
  } catch (error) {
    status.value = `Error: ${error.message}`
  }
}
</script>
```

---

## Node.js Integration

### Backend Server

```bash
npm install @fhevm/sdk ethers
```

### Express Server Example

```javascript
// server.js
import express from 'express'
import { createFhevmInstance, encrypt, decrypt } from '@fhevm/sdk'
import { ethers } from 'ethers'

const app = express()
app.use(express.json())

let fhevm = null

// Initialize FHEVM on startup
async function initialize() {
  fhevm = await createFhevmInstance({
    network: 'sepolia'
  })
  console.log('FHEVM initialized')
}

// Encrypt endpoint
app.post('/api/encrypt', async (req, res) => {
  try {
    const { value, type } = req.body

    if (!fhevm) {
      return res.status(500).json({ error: 'FHEVM not initialized' })
    }

    const encrypted = await encrypt(fhevm, value, type)

    res.json({
      success: true,
      encrypted: Array.from(encrypted)
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

// Submit to contract endpoint
app.post('/api/submit', async (req, res) => {
  try {
    const { value, type } = req.body

    const provider = new ethers.JsonRpcProvider(process.env.RPC_URL)
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider)

    const contract = new ethers.Contract(
      process.env.CONTRACT_ADDRESS,
      ['function submitData(bytes calldata encryptedData) external'],
      wallet
    )

    const encrypted = await encrypt(fhevm, value, type)
    const tx = await contract.submitData(encrypted)
    await tx.wait()

    res.json({
      success: true,
      txHash: tx.hash
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

initialize().then(() => {
  app.listen(3000, () => {
    console.log('Server running')
  })
})
```

---

## TypeScript Configuration

### tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["ES2020", "DOM"],
    "moduleResolution": "node",
    "esModuleInterop": true,
    "strict": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "jsx": "react-jsx",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "types": ["node"]
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### Type Definitions

```typescript
// types/fhevm.d.ts
import { Contract } from 'ethers'

declare module '@fhevm/sdk' {
  export type EncryptionType = 'uint8' | 'uint16' | 'uint32' | 'uint64' | 'bool' | 'address'
  export type Network = 'sepolia' | 'local' | 'mainnet'

  export interface FhevmConfig {
    network: Network
    gatewayUrl?: string
    contractAddress?: string
    aclAddress?: string
    publicKey?: string
  }

  export interface FhevmInstance {
    instance: any
    publicKey: string
    network: string
    contractAddress?: string
    aclAddress?: string
  }

  export function createFhevmInstance(config: FhevmConfig): Promise<FhevmInstance>
  export function encrypt(fhevm: FhevmInstance, value: number | boolean | string, type: EncryptionType): Promise<Uint8Array>
  export function decrypt(fhevm: FhevmInstance, contract: Contract, method: string, options?: any): Promise<any>
}

declare module '@fhevm/sdk/react' {
  import { ReactNode } from 'react'
  import { FhevmConfig, FhevmInstance, EncryptionType } from '@fhevm/sdk'

  export interface FhevmProviderProps {
    config: FhevmConfig
    children: ReactNode
  }

  export function FhevmProvider(props: FhevmProviderProps): JSX.Element

  export function useFhevmInstance(): {
    fhevm: FhevmInstance | null
    isReady: boolean
    error: Error | null
  }

  export function useEncrypt(): {
    encrypt: (value: number | boolean | string, type: EncryptionType) => Promise<Uint8Array>
    isEncrypting: boolean
    error: Error | null
  }

  export function useDecrypt(): {
    decrypt: (contract: any, method: string, options?: any) => Promise<any>
    isDecrypting: boolean
    result: any
    error: Error | null
  }
}
```

---

## Testing Integration

### Jest Configuration

```javascript
// jest.config.js
export default {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '^@fhevm/sdk$': '<rootDir>/node_modules/@fhevm/sdk/dist/index.js',
    '^@fhevm/sdk/react$': '<rootDir>/node_modules/@fhevm/sdk/dist/react/index.js'
  },
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest'
  }
}
```

### Test Example

```javascript
// __tests__/useEncrypt.test.js
import { renderHook, act } from '@testing-library/react'
import { FhevmProvider, useEncrypt } from '@fhevm/sdk/react'

const wrapper = ({ children }) => (
  <FhevmProvider config={{ network: 'sepolia' }}>
    {children}
  </FhevmProvider>
)

describe('useEncrypt', () => {
  it('should encrypt value', async () => {
    const { result } = renderHook(() => useEncrypt(), { wrapper })

    await act(async () => {
      const encrypted = await result.current.encrypt(42, 'uint32')
      expect(encrypted).toBeInstanceOf(Uint8Array)
    })
  })

  it('should set isEncrypting during encryption', async () => {
    const { result } = renderHook(() => useEncrypt(), { wrapper })

    expect(result.current.isEncrypting).toBe(false)

    const promise = act(async () => {
      await result.current.encrypt(42, 'uint32')
    })

    expect(result.current.isEncrypting).toBe(true)
    await promise
    expect(result.current.isEncrypting).toBe(false)
  })
})
```

---

## Resources

- **SDK Documentation**: [SDK_DOCUMENTATION.md](./SDK_DOCUMENTATION.md)
- **Quick Start**: [QUICK_START.md](./QUICK_START.md)
- **Architecture**: [ARCHITECTURE.md](./ARCHITECTURE.md)
- **GitHub**: https://github.com/RileyLueilwitz/fhevm-react-template
- **Live Demo**: https://fhe-green-travel-rewards.vercel.app/
