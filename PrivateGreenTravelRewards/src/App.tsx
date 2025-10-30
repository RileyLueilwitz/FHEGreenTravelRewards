import { useState, useEffect } from 'react'
import { useFhevmInstance, useEncrypt } from '@fhevm/sdk'
import { BrowserProvider, Contract, formatEther } from 'ethers'
import { WalletSection } from './components/WalletSection'
import { PeriodStatus } from './components/PeriodStatus'
import { SubmissionForm } from './components/SubmissionForm'
import { UserStats } from './components/UserStats'
import { AdminControls } from './components/AdminControls'
import { AboutSection } from './components/AboutSection'
import { LoadingOverlay } from './components/LoadingOverlay'
import { CONTRACT_ADDRESS, CONTRACT_ABI } from './config/contract'
import './App.css'

function App() {
  const { fhevm, isReady } = useFhevmInstance()
  const { encrypt } = useEncrypt()

  const [provider, setProvider] = useState<BrowserProvider | null>(null)
  const [signer, setSigner] = useState<any>(null)
  const [contract, setContract] = useState<Contract | null>(null)
  const [userAddress, setUserAddress] = useState<string>('')
  const [network, setNetwork] = useState<string>('')
  const [isAdmin, setIsAdmin] = useState(false)
  const [periodInfo, setPeriodInfo] = useState<any>(null)
  const [userStats, setUserStats] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [loadingMessage, setLoadingMessage] = useState('')

  const connectWallet = async () => {
    if (typeof window.ethereum === 'undefined') {
      alert('Please install MetaMask!')
      return
    }

    try {
      setLoading(true)
      setLoadingMessage('Connecting wallet...')

      await window.ethereum.request({ method: 'eth_requestAccounts' })

      const web3Provider = new BrowserProvider(window.ethereum)
      const web3Signer = await web3Provider.getSigner()
      const address = await web3Signer.getAddress()
      const networkInfo = await web3Provider.getNetwork()

      setProvider(web3Provider)
      setSigner(web3Signer)
      setUserAddress(address)
      setNetwork(networkInfo.name)

      const contractInstance = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, web3Signer)
      setContract(contractInstance)

      // Check admin status
      const owner = await contractInstance.owner()
      setIsAdmin(owner.toLowerCase() === address.toLowerCase())

      // Load initial data
      await loadPeriodInfo(contractInstance)
      await loadUserStats(contractInstance, address)

      setLoading(false)
    } catch (error) {
      console.error('Error connecting wallet:', error)
      setLoading(false)
      alert('Failed to connect wallet')
    }
  }

  const loadPeriodInfo = async (contractInstance: Contract) => {
    try {
      const info = await contractInstance.getCurrentPeriodInfo()
      setPeriodInfo({
        period: info[0].toString(),
        active: info[1],
        ended: info[2],
        startTime: info[3].toString(),
        endTime: info[4].toString(),
        participantCount: info[5].toString(),
        timeRemaining: info[6].toString()
      })
    } catch (error) {
      console.error('Error loading period info:', error)
    }
  }

  const loadUserStats = async (contractInstance: Contract, address: string) => {
    try {
      const stats = await contractInstance.getLifetimeStats(address)
      const participantStatus = await contractInstance.getParticipantStatus(address)

      setUserStats({
        totalRewards: stats[0].toString(),
        totalCarbonSaved: stats[1].toString(),
        currentReward: participantStatus[3].toString()
      })
    } catch (error) {
      console.error('Error loading user stats:', error)
    }
  }

  const submitTravelData = async (carbonAmount: number) => {
    if (!contract || !userAddress) return

    try {
      setLoading(true)
      setLoadingMessage('Submitting travel data...')

      const tx = await contract.submitTravelData(carbonAmount)
      await tx.wait()

      await loadPeriodInfo(contract)
      await loadUserStats(contract, userAddress)

      setLoading(false)
      alert('Travel data submitted successfully!')
    } catch (error) {
      console.error('Error submitting travel data:', error)
      setLoading(false)
      alert('Failed to submit travel data')
    }
  }

  const claimRewards = async () => {
    if (!contract || !userAddress) return

    try {
      setLoading(true)
      setLoadingMessage('Claiming rewards...')

      const tx = await contract.claimRewards()
      await tx.wait()

      await loadUserStats(contract, userAddress)

      setLoading(false)
      alert('Rewards claimed successfully!')
    } catch (error) {
      console.error('Error claiming rewards:', error)
      setLoading(false)
      alert('Failed to claim rewards')
    }
  }

  const startNewPeriod = async () => {
    if (!contract) return

    try {
      setLoading(true)
      setLoadingMessage('Starting new period...')

      const tx = await contract.startNewPeriod()
      await tx.wait()

      await loadPeriodInfo(contract)

      setLoading(false)
      alert('New period started!')
    } catch (error) {
      console.error('Error starting period:', error)
      setLoading(false)
      alert('Failed to start period')
    }
  }

  const endCurrentPeriod = async () => {
    if (!contract) return

    try {
      setLoading(true)
      setLoadingMessage('Ending period...')

      const tx = await contract.endPeriod()
      await tx.wait()

      await loadPeriodInfo(contract)

      setLoading(false)
      alert('Period ended!')
    } catch (error) {
      console.error('Error ending period:', error)
      setLoading(false)
      alert('Failed to end period')
    }
  }

  const processNextParticipant = async () => {
    if (!contract) return

    try {
      setLoading(true)
      setLoadingMessage('Processing participant...')

      const tx = await contract.processNextParticipant()
      await tx.wait()

      setLoading(false)
      alert('Participant processed!')
    } catch (error) {
      console.error('Error processing participant:', error)
      setLoading(false)
      alert('Failed to process participant')
    }
  }

  return (
    <div className="app">
      <div className="container">
        <header>
          <h1>🌱 Private Green Travel Rewards</h1>
          <p className="subtitle">
            Anonymous Eco-Friendly Transportation Incentives with FHE Privacy
          </p>
        </header>

        <WalletSection
          userAddress={userAddress}
          network={network}
          onConnect={connectWallet}
        />

        {periodInfo && !periodInfo.active && (
          <div className="warning-banner">
            ⚠️ <strong>No Active Period</strong> - The reward period has not been started yet.
            {isAdmin && <span> Please start a new period.</span>}
            {!isAdmin && <span> Please ask the contract owner to start a new period.</span>}
          </div>
        )}

        {periodInfo && (
          <PeriodStatus periodInfo={periodInfo} />
        )}

        <SubmissionForm
          onSubmit={submitTravelData}
          disabled={!userAddress || !periodInfo?.active}
        />

        {userStats && (
          <UserStats
            stats={userStats}
            onClaim={claimRewards}
            disabled={!userAddress}
          />
        )}

        {isAdmin && (
          <AdminControls
            onStartPeriod={startNewPeriod}
            onEndPeriod={endCurrentPeriod}
            onProcessNext={processNextParticipant}
          />
        )}

        <AboutSection />

        <footer>
          <p>
            Contract Address: <code>{CONTRACT_ADDRESS}</code>
          </p>
          <p>Powered by FHE Technology for Maximum Privacy</p>
        </footer>
      </div>

      {loading && <LoadingOverlay message={loadingMessage} />}
    </div>
  )
}

export default App
