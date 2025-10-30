interface AdminControlsProps {
  onStartPeriod: () => void
  onEndPeriod: () => void
  onProcessNext: () => void
}

export function AdminControls({
  onStartPeriod,
  onEndPeriod,
  onProcessNext
}: AdminControlsProps) {
  return (
    <div className="admin-section">
      <h2>⚙️ Admin Controls</h2>
      <div className="admin-buttons">
        <button className="btn btn-admin" onClick={onStartPeriod}>
          Start New Period
        </button>
        <button className="btn btn-admin" onClick={onEndPeriod}>
          End Current Period
        </button>
        <button className="btn btn-admin" onClick={onProcessNext}>
          Process Next Participant
        </button>
      </div>
    </div>
  )
}
