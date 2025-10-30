export function AboutSection() {
  return (
    <div className="info-section">
      <h2>ℹ️ About This System</h2>
      <div className="about-content">
        <p>
          <strong>Private Green Travel Rewards</strong> is a blockchain-based incentive system
          that rewards users for reducing their carbon footprint through eco-friendly transportation choices.
        </p>
        <h3>🔐 Privacy Features</h3>
        <ul>
          <li>Your carbon savings data is encrypted using Fully Homomorphic Encryption (FHE)</li>
          <li>Rewards are calculated without revealing individual travel patterns</li>
          <li>Only you can view your personal statistics</li>
        </ul>
        <h3>🎯 How It Works</h3>
        <ol>
          <li>Each reward period lasts 7 days</li>
          <li>Submit your carbon savings data during the active period</li>
          <li>Rewards are automatically calculated when the period ends</li>
          <li>Claim your earned tokens anytime</li>
        </ol>
        <h3>🌟 Reward Structure</h3>
        <p>
          Rewards are tiered based on the amount of carbon dioxide equivalent (CO2e) you save:
        </p>
        <ul>
          <li><strong>Bronze Tier:</strong> 1,000-4,999 grams → 10 tokens</li>
          <li><strong>Silver Tier:</strong> 5,000-9,999 grams → 25 tokens</li>
          <li><strong>Gold Tier:</strong> 10,000+ grams → 50 tokens</li>
        </ul>
      </div>
    </div>
  )
}
