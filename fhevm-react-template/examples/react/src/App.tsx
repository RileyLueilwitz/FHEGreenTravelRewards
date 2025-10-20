/**
 * React App Component
 * Demonstrates Universal FHEVM SDK usage with React + Vite
 */

import { useState } from 'react'
import { useFhevmInstance, useEncrypt } from '@fhevm/sdk/react'
import { ethers } from 'ethers'
import './App.css'

const CONTRACT_ADDRESS = '0x8Ac1d3E49A73F8328e43719dCF6fBfeF4405937B'
const CONTRACT_ABI = [
  'function submitTravelData(bytes calldata encryptedAmount) external',
  'function getCurrentPeriodInfo() external view returns (uint256, bool, bool, uint256, uint256, uint256, uint256)',
  'function getParticipantStatus(address participant) external view returns (bool, uint256, bool, uint256)'
]

function App() {
  const { fhevm, isReady } = useFhevmInstance()
  const { encrypt, isEncrypting } = useEncrypt()

  const [carbonSaved, setCarbonSaved] = useState<number>(5000)
  const [status, setStatus] = useState<string>('')
  const [account, setAccount] = useState<string>('')

  const connectWallet = async () => {
    if (typeof window.ethereum === 'undefined') {
      setStatus('❌ Please install MetaMask')
      return
    }

    try {
      const provider = new ethers.BrowserProvider(window.ethereum)
      const accounts = await provider.send('eth_requestAccounts', [])
      setAccount(accounts[0])
      setStatus(`✅ Connected: ${accounts[0].substring(0, 10)}...`)
    } catch (error) {
      setStatus(`❌ Connection failed: ${error instanceof Error ? error.message : 'Unknown'}`)
    }
  }

  const submitTravelData = async () => {
    if (!isReady || !fhevm) {
      setStatus('⏳ FHEVM not ready. Please wait...')
      return
    }

    if (!account) {
      setStatus('❌ Please connect wallet first')
      return
    }

    try {
      setStatus('🔐 Encrypting with @fhevm/sdk...')

      // ✅ SDK INTEGRATION: One-line encryption
      const encryptedValue = await encrypt(carbonSaved, 'uint32')

      setStatus('📡 Submitting to contract...')

      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer)

      const tx = await contract.submitTravelData(encryptedValue)
      setStatus(`⏳ TX sent: ${tx.hash.substring(0, 15)}... Waiting...`)

      await tx.wait()
      setStatus(`✅ Success! Carbon savings submitted privately!`)
    } catch (error) {
      setStatus(`❌ Error: ${error instanceof Error ? error.message : 'Unknown'}`)
    }
  }

  return (
    <div className="app">
      <div className="card">
        <h1>🔐 React + Vite + FHEVM SDK</h1>
        <p className="subtitle">Privacy-preserving green travel rewards</p>

        {/* SDK Status */}
        <div className="status-box">
          <h3>SDK Status</h3>
          <div className="status-grid">
            <span>FHEVM:</span>
            <span>{isReady ? '✅ Ready' : '⏳ Loading...'}</span>
            <span>Network:</span>
            <span>Sepolia Testnet</span>
            {isReady && fhevm && (
              <>
                <span>Public Key:</span>
                <span className="monospace">{fhevm.publicKey.substring(0, 30)}...</span>
              </>
            )}
          </div>
        </div>

        {/* Wallet Connection */}
        <div className="section">
          <h3>1. Connect Wallet</h3>
          {!account ? (
            <button onClick={connectWallet} className="btn-primary">
              🦊 Connect MetaMask
            </button>
          ) : (
            <p className="success">✅ Connected: {account.substring(0, 15)}...</p>
          )}
        </div>

        {/* Submit Data */}
        <div className="section">
          <h3>2. Submit Encrypted Data</h3>
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
            <div className="tiers">
              <span className="tier bronze">🥉 Bronze (1k-5k): 10 tokens</span>
              <span className="tier silver">🥈 Silver (5k-10k): 25 tokens</span>
              <span className="tier gold">🥇 Gold (10k+): 50 tokens</span>
            </div>
          </div>
          <button
            onClick={submitTravelData}
            disabled={!isReady || !account || isEncrypting}
            className="btn-primary"
          >
            {isEncrypting ? '🔐 Encrypting...' : '🚀 Submit Encrypted Data'}
          </button>
        </div>

        {/* Status */}
        {status && (
          <div className="status-message">
            {status}
          </div>
        )}

        {/* Code Example */}
        <div className="code-section">
          <h3>💡 SDK Integration (3 lines!)</h3>
          <pre><code>{`import { FhevmProvider, useEncrypt } from '@fhevm/sdk/react'

// 1. Wrap app
<FhevmProvider config={{ network: 'sepolia' }}>
  <App />
</FhevmProvider>

// 2. Use hook
const { encrypt } = useEncrypt()

// 3. Encrypt & submit
const encrypted = await encrypt(value, 'uint32')
await contract.submitData(encrypted)`}</code></pre>
        </div>

        {/* Links */}
        <div className="links">
          <a href="https://docs.zama.ai" target="_blank" rel="noopener noreferrer">
            📚 Zama Docs
          </a>
          <a href={`https://sepolia.etherscan.io/address/${CONTRACT_ADDRESS}`} target="_blank" rel="noopener noreferrer">
            📝 Contract
          </a>
          <a href="https://github.com/..." target="_blank" rel="noopener noreferrer">
            💻 GitHub
          </a>
        </div>
      </div>
    </div>
  )
}

export default App
