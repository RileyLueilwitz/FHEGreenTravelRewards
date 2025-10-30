import { useState } from 'react'

interface SubmissionFormProps {
  onSubmit: (amount: number) => void
  disabled: boolean
}

export function SubmissionForm({ onSubmit, disabled }: SubmissionFormProps) {
  const [carbonAmount, setCarbonAmount] = useState('')

  const handleSubmit = () => {
    const amount = parseInt(carbonAmount)
    if (isNaN(amount) || amount <= 0) {
      alert('Please enter a valid carbon amount')
      return
    }
    onSubmit(amount)
    setCarbonAmount('')
  }

  return (
    <div className="action-section">
      <h2>📊 Submit Carbon Savings</h2>
      <p className="section-description">
        Submit your carbon reduction data privately using FHE encryption
      </p>

      <div className="form-group">
        <label htmlFor="carbonAmount">Carbon Saved (grams CO2e)</label>
        <input
          type="number"
          id="carbonAmount"
          placeholder="Enter amount (e.g., 5000)"
          min="0"
          step="100"
          value={carbonAmount}
          onChange={(e) => setCarbonAmount(e.target.value)}
          disabled={disabled}
        />
        <div className="help-text">
          💡 Reward Tiers:
          <ul>
            <li>🥉 Bronze (1,000-4,999g): 10 tokens</li>
            <li>🥈 Silver (5,000-9,999g): 25 tokens</li>
            <li>🥇 Gold (10,000g+): 50 tokens</li>
          </ul>
        </div>
      </div>

      <button
        className="btn btn-success"
        onClick={handleSubmit}
        disabled={disabled || !carbonAmount}
      >
        Submit Travel Data
      </button>
    </div>
  )
}
