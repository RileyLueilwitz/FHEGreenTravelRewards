import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { FhevmProvider } from '@fhevm/sdk'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <FhevmProvider network="sepolia">
      <App />
    </FhevmProvider>
  </React.StrictMode>,
)
