interface WalletSectionProps {
  userAddress: string
  network: string
  onConnect: () => void
}

export function WalletSection({ userAddress, network, onConnect }: WalletSectionProps) {
  const formatAddress = (address: string) => {
    return `${address.substring(0, 6)}...${address.substring(38)}`
  }

  return (
    <div className="wallet-section">
      {!userAddress ? (
        <button className="btn btn-primary" onClick={onConnect}>
          Connect Wallet
        </button>
      ) : (
        <div className="wallet-info">
          <span className="wallet-address">{formatAddress(userAddress)}</span>
          <span className="network-badge">{network}</span>
        </div>
      )}
    </div>
  )
}
