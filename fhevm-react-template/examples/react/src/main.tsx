/**
 * React (Vite) Entry Point
 * Integrates Universal FHEVM SDK
 */

import React from 'react'
import ReactDOM from 'react-dom/client'
import { FhevmProvider } from '@fhevm/sdk/react'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <FhevmProvider config={{ network: 'sepolia' }}>
      <App />
    </FhevmProvider>
  </React.StrictMode>,
)
