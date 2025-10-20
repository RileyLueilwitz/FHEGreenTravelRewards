# Quick Start Guide

Get started with Universal FHEVM SDK in 5 minutes.

## Installation

```bash
npm install @fhevm/sdk ethers
```

## Basic Usage (Vanilla JavaScript)

### Step 1: Initialize FHEVM

```javascript
import { createFhevmInstance } from '@fhevm/sdk'

const fhevm = await createFhevmInstance({
  network: 'sepolia'
})

console.log('FHEVM Ready!')
console.log('Public Key:', fhevm.publicKey)
```

### Step 2: Encrypt Data

```javascript
import { encrypt } from '@fhevm/sdk'

// Encrypt a number
const encryptedValue = await encrypt(fhevm, 42, 'uint32')

console.log('Encrypted:', encryptedValue)
// Output: Uint8Array [...]
```

### Step 3: Submit to Contract

```javascript
import { ethers } from 'ethers'

const provider = new ethers.BrowserProvider(window.ethereum)
const signer = await provider.getSigner()

const contract = new ethers.Contract(
  '0x8Ac1d3E49A73F8328e43719dCF6fBfeF4405937B',
  ['function submitData(bytes calldata encryptedData) external'],
  signer
)

const tx = await contract.submitData(encryptedValue)
await tx.wait()

console.log('Data submitted!')
```

### Step 4: Decrypt Result

```javascript
import { decrypt } from '@fhevm/sdk'

const result = await decrypt(fhevm, contract, 'getData')

console.log('Decrypted result:', result)
```

**That's it! You're using FHE encryption in 4 steps.**

---

## React Usage

### Step 1: Wrap App with Provider

```javascript
// index.jsx or App.jsx
import { FhevmProvider } from '@fhevm/sdk/react'
import ReactDOM from 'react-dom/client'
import App from './App'

ReactDOM.createRoot(document.getElementById('root')).render(
  <FhevmProvider config={{ network: 'sepolia' }}>
    <App />
  </FhevmProvider>
)
```

### Step 2: Use SDK Hooks

```javascript
// SubmitData.jsx
import { useEncrypt, useFhevmInstance } from '@fhevm/sdk/react'
import { useState } from 'react'

function SubmitData() {
  const { fhevm, isReady } = useFhevmInstance()
  const { encrypt, isEncrypting } = useEncrypt()
  const [value, setValue] = useState(42)

  const handleSubmit = async () => {
    // Encrypt data
    const encrypted = await encrypt(value, 'uint32')

    // Submit to contract
    const tx = await contract.submitData(encrypted)
    await tx.wait()

    alert('Data submitted!')
  }

  if (!isReady) return <div>Loading FHEVM...</div>

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
    </div>
  )
}
```

**That's it! FHE encryption in React with 2 hooks.**

---

## Next.js Usage

### Step 1: Create Provider Wrapper

```javascript
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

### Step 2: Use in Pages

```javascript
// pages/index.jsx
import { useFhevmInstance, useEncrypt } from '@fhevm/sdk/react'

export default function Home() {
  const { fhevm, isReady } = useFhevmInstance()
  const { encrypt } = useEncrypt()

  const submitData = async () => {
    const encrypted = await encrypt(42, 'uint32')
    await contract.submitData(encrypted)
  }

  return (
    <div>
      <h1>FHEVM Status: {isReady ? 'Ready' : 'Loading...'}</h1>
      <button onClick={submitData}>Submit Encrypted Data</button>
    </div>
  )
}
```

---

## Node.js Usage (Backend)

```javascript
// server.js
import { createFhevmInstance, encrypt } from '@fhevm/sdk'
import { ethers } from 'ethers'

// Initialize FHEVM
const fhevm = await createFhevmInstance({
  network: 'sepolia'
})

// Create provider with private key
const provider = new ethers.JsonRpcProvider('https://sepolia.infura.io/v3/YOUR_KEY')
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider)

// Encrypt data
const encryptedValue = await encrypt(fhevm, 1000, 'uint32')

// Submit to contract
const contract = new ethers.Contract(contractAddress, abi, wallet)
const tx = await contract.submitData(encryptedValue)
await tx.wait()

console.log('Server-side encryption complete!')
```

---

## Common Patterns

### Pattern 1: Connect Wallet

```javascript
import { ethers } from 'ethers'

async function connectWallet() {
  if (!window.ethereum) {
    alert('Please install MetaMask')
    return
  }

  const provider = new ethers.BrowserProvider(window.ethereum)
  await provider.send('eth_requestAccounts', [])
  const signer = await provider.getSigner()
  const address = await signer.getAddress()

  console.log('Connected:', address)
  return { provider, signer, address }
}
```

### Pattern 2: Encrypt Multiple Values

```javascript
import { encryptBatch } from '@fhevm/sdk'

const values = [
  { value: 100, type: 'uint32' },
  { value: 200, type: 'uint32' },
  { value: true, type: 'bool' }
]

const encrypted = await encryptBatch(fhevm, values)

// Submit all encrypted values
await contract.submitBatch(encrypted)
```

### Pattern 3: User Decrypt with Signature

```javascript
import { decrypt, signEIP712 } from '@fhevm/sdk'

// Generate EIP-712 signature
const signature = await signEIP712(signer, {
  contractAddress: contract.address,
  functionName: 'getPrivateData',
  userAddress: await signer.getAddress()
})

// Decrypt with signature
const privateData = await decrypt(fhevm, contract, 'getPrivateData', {
  signature,
  publicKey: fhevm.publicKey,
  userAddress: await signer.getAddress()
})

console.log('Private data:', privateData)
```

### Pattern 4: Error Handling

```javascript
import { createFhevmInstance, encrypt } from '@fhevm/sdk'

async function safeEncrypt(value) {
  try {
    const fhevm = await createFhevmInstance({ network: 'sepolia' })
    const encrypted = await encrypt(fhevm, value, 'uint32')
    return { success: true, data: encrypted }
  } catch (error) {
    console.error('Encryption failed:', error.message)
    return { success: false, error: error.message }
  }
}

const result = await safeEncrypt(42)
if (result.success) {
  console.log('Encrypted:', result.data)
} else {
  console.error('Error:', result.error)
}
```

---

## Supported Data Types

| Type | Range | Example |
|------|-------|---------|
| `uint8` | 0 to 255 | `await encrypt(fhevm, 100, 'uint8')` |
| `uint16` | 0 to 65,535 | `await encrypt(fhevm, 5000, 'uint16')` |
| `uint32` | 0 to 4,294,967,295 | `await encrypt(fhevm, 1000000, 'uint32')` |
| `uint64` | 0 to 2^64 - 1 | `await encrypt(fhevm, 999999999n, 'uint64')` |
| `bool` | true/false | `await encrypt(fhevm, true, 'bool')` |
| `address` | Ethereum address | `await encrypt(fhevm, '0x...', 'address')` |

---

## Network Configuration

### Sepolia Testnet (Default)

```javascript
const fhevm = await createFhevmInstance({
  network: 'sepolia',
  gatewayUrl: 'https://gateway.sepolia.zama.ai'
})
```

### Local Development

```javascript
const fhevm = await createFhevmInstance({
  network: 'local',
  gatewayUrl: 'http://localhost:8545'
})
```

### Mainnet (Production)

```javascript
const fhevm = await createFhevmInstance({
  network: 'mainnet',
  gatewayUrl: 'https://gateway.zama.ai'
})
```

---

## Next Steps

- **Full API Reference**: See [SDK_DOCUMENTATION.md](./SDK_DOCUMENTATION.md)
- **Architecture Guide**: See [ARCHITECTURE.md](./ARCHITECTURE.md)
- **Framework Integration**: See [INTEGRATION.md](./INTEGRATION.md)
- **Live Example**: Visit https://fhe-green-travel-rewards.vercel.app/
- **GitHub**: https://github.com/RileyLueilwitz/fhevm-react-template

---

## Getting Help

- **Issues**: https://github.com/RileyLueilwitz/fhevm-react-template/issues
- **Zama Docs**: https://docs.zama.ai
- **Discord**: Join the Zama community

---

**You're ready to build privacy-preserving dApps with FHE! 🎉**
