interface UserStatsProps {
  stats: {
    totalRewards: string
    totalCarbonSaved: string
    currentReward: string
  }
  onClaim: () => void
  disabled: boolean
}

export function UserStats({ stats, onClaim, disabled }: UserStatsProps) {
  return (
    <div className="stats-section">
      <h2>📈 Your Statistics</h2>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">🏆</div>
          <div className="stat-label">Total Rewards Earned</div>
          <div className="stat-value">{stats.totalRewards}</div>
          <div className="stat-unit">tokens</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🌍</div>
          <div className="stat-label">Lifetime Carbon Saved</div>
          <div className="stat-value">{stats.totalCarbonSaved}</div>
          <div className="stat-unit">grams CO2e</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📅</div>
          <div className="stat-label">Current Period Reward</div>
          <div className="stat-value">{stats.currentReward}</div>
          <div className="stat-unit">tokens</div>
        </div>
      </div>

      <button
        className="btn btn-claim"
        onClick={onClaim}
        disabled={disabled || stats.totalRewards === '0'}
      >
        Claim Rewards
      </button>
    </div>
  )
}
