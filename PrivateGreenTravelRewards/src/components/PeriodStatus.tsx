import { useEffect, useState } from 'react'

interface PeriodStatusProps {
  periodInfo: {
    period: string
    active: boolean
    ended: boolean
    startTime: string
    endTime: string
    participantCount: string
    timeRemaining: string
  }
}

export function PeriodStatus({ periodInfo }: PeriodStatusProps) {
  const [timeDisplay, setTimeDisplay] = useState('')

  useEffect(() => {
    const updateTime = () => {
      const remaining = parseInt(periodInfo.timeRemaining)
      if (remaining <= 0) {
        setTimeDisplay('Period Ended')
        return
      }

      const days = Math.floor(remaining / 86400)
      const hours = Math.floor((remaining % 86400) / 3600)
      const minutes = Math.floor((remaining % 3600) / 60)

      setTimeDisplay(`${days}d ${hours}h ${minutes}m`)
    }

    updateTime()
    const interval = setInterval(updateTime, 60000) // Update every minute

    return () => clearInterval(interval)
  }, [periodInfo.timeRemaining])

  return (
    <div className="status-section">
      <h2>🔄 Current Period Status</h2>
      <div className="info-grid">
        <div className="info-card">
          <div className="info-label">Period Number</div>
          <div className="info-value">{periodInfo.period}</div>
        </div>
        <div className="info-card">
          <div className="info-label">Status</div>
          <div className="info-value">
            {periodInfo.active ? '✅ Active' : periodInfo.ended ? '⏹️ Ended' : '❌ Inactive'}
          </div>
        </div>
        <div className="info-card">
          <div className="info-label">Participants</div>
          <div className="info-value">{periodInfo.participantCount}</div>
        </div>
        <div className="info-card">
          <div className="info-label">Time Remaining</div>
          <div className="info-value">{timeDisplay}</div>
        </div>
      </div>
    </div>
  )
}
