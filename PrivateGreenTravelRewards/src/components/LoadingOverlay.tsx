interface LoadingOverlayProps {
  message: string
}

export function LoadingOverlay({ message }: LoadingOverlayProps) {
  return (
    <div className="loading-overlay">
      <div className="loading-spinner"></div>
      <div className="loading-text">{message}</div>
    </div>
  )
}
