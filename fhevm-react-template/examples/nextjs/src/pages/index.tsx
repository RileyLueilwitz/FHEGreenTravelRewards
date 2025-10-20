/**
 * Next.js Home Page
 * Demonstrates Universal FHEVM SDK usage
 */

import { useState } from 'react'
import { useFhevmInstance, useEncrypt } from '@fhevm/sdk/react'
import { ethers } from 'ethers'
import Head from 'next/head'

// Import contract ABI (you should place this in a separate file)
const CONTRACT_ADDRESS = '0x8Ac1d3E49A73F8328e43719dCF6fBfeF4405937B'
const CONTRACT_ABI = [
  'function submitTravelData(bytes calldata encryptedAmount) external',
  'function getCurrentPeriodInfo() external view returns (uint256, bool, bool, uint256, uint256, uint256, uint256)',
  'function getParticipantStatus(address participant) external view returns (bool, uint256, bool, uint256)'
]

export default function Home() {
  const { fhevm, isReady } = useFhevmInstance()
  const { encrypt, isEncrypting } = useEncrypt()

  const [carbonSaved, setCarbonSaved] = useState<number>(5000)
  const [status, setStatus] = useState<string>('')
  const [account, setAccount] = useState<string>('')

  // Connect wallet
  const connectWallet = async () => {
    if (typeof window.ethereum === 'undefined') {
      setStatus('Please install MetaMask')
      return
    }

    try {
      const provider = new ethers.BrowserProvider(window.ethereum)
      const accounts = await provider.send('eth_requestAccounts', [])
      setAccount(accounts[0])
      setStatus(`Connected: ${accounts[0].substring(0, 6)}...${accounts[0].substring(38)}`)
    } catch (error) {
      setStatus(`Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Submit encrypted travel data using SDK
  const submitTravelData = async () => {
    if (!isReady || !fhevm) {
      setStatus('FHEVM not ready. Please wait...')
      return
    }

    if (!account) {
      setStatus('Please connect wallet first')
      return
    }

    try {
      setStatus('Encrypting data using @fhevm/sdk...')

      // ✅ SDK INTEGRATION: Encrypt data with one line
      const encryptedValue = await encrypt(carbonSaved, 'uint32')

      setStatus('Encrypted! Submitting to contract...')

      // Submit to contract
      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer)

      const tx = await contract.submitTravelData(encryptedValue)
      setStatus(`Transaction sent: ${tx.hash}. Waiting for confirmation...`)

      await tx.wait()
      setStatus(`✅ Success! Carbon savings submitted privately. TX: ${tx.hash.substring(0, 10)}...`)
    } catch (error) {
      setStatus(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  return (
    <>
      <Head>
        <title>Next.js + Universal FHEVM SDK</title>
        <meta name="description" content="Next.js example using Universal FHEVM SDK" />
      </Head>

      <main className="container">
        <div className="card">
          <h1>🔐 Next.js + Universal FHEVM SDK</h1>
          <p>Privacy-preserving green travel rewards using @fhevm/sdk</p>

          {/* SDK Status */}
          <div className="status-box">
            <h3>SDK Status</h3>
            <p>FHEVM Instance: {isReady ? '✅ Ready' : '⏳ Loading...'}</p>
            <p>Network: Sepolia Testnet</p>
            {isReady && <p>Public Key: {fhevm?.publicKey.substring(0, 20)}...</p>}
          </div>

          {/* Wallet Connection */}
          <div className="section">
            <h3>1. Connect Wallet</h3>
            {!account ? (
              <button onClick={connectWallet} className="btn-primary">
                Connect MetaMask
              </button>
            ) : (
              <p className="success">✅ Connected: {account.substring(0, 10)}...</p>
            )}
          </div>

          {/* Submit Travel Data */}
          <div className="section">
            <h3>2. Submit Encrypted Carbon Savings</h3>
            <div className="input-group">
              <label>
                Carbon Saved (grams CO2e):
                <input
                  type="number"
                  value={carbonSaved}
                  onChange={(e) => setCarbonSaved(Number(e.target.value))}
                  min="1000"
                  max="50000"
                  disabled={!isReady || isEncrypting}
                />
              </label>
              <small>
                🥉 Bronze (1,000-4,999g): 10 tokens |
                🥈 Silver (5,000-9,999g): 25 tokens |
                🥇 Gold (10,000+g): 50 tokens
              </small>
            </div>
            <button
              onClick={submitTravelData}
              disabled={!isReady || !account || isEncrypting}
              className="btn-primary"
            >
              {isEncrypting ? 'Encrypting...' : 'Submit Encrypted Data'}
            </button>
          </div>

          {/* Status Messages */}
          {status && (
            <div className="status-message">
              <p>{status}</p>
            </div>
          )}

          {/* SDK Integration Info */}
          <div className="info-box">
            <h3>🎯 SDK Integration Example</h3>
            <pre><code>{`// pages/_app.tsx
import { FhevmProvider } from '@fhevm/sdk/react'

export default function App({ Component, pageProps }) {
  return (
    <FhevmProvider config={{ network: 'sepolia' }}>
      <Component {...pageProps} />
    </FhevmProvider>
  )
}

// pages/index.tsx
import { useEncrypt } from '@fhevm/sdk/react'

const { encrypt } = useEncrypt()
const encrypted = await encrypt(value, 'uint32')
await contract.submitData(encrypted)`}</code></pre>
          </div>

          {/* Links */}
          <div className="links">
            <a href="https://docs.zama.ai" target="_blank" rel="noopener noreferrer">
              📚 Zama Docs
            </a>
            <a href={`https://sepolia.etherscan.io/address/${CONTRACT_ADDRESS}`} target="_blank" rel="noopener noreferrer">
              📝 View Contract
            </a>
            <a href="https://github.com/..." target="_blank" rel="noopener noreferrer">
              💻 GitHub
            </a>
          </div>
        </div>
      </main>
    </>
  )
}
