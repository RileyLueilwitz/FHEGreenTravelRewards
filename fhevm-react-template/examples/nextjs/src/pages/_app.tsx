/**
 * Next.js App Component
 * Integrates Universal FHEVM SDK with FhevmProvider
 */

import { FhevmProvider } from '@fhevm/sdk/react'
import type { AppProps } from 'next/app'
import '../styles/globals.css'

export default function App({ Component, pageProps }: AppProps) {
  return (
    <FhevmProvider config={{ network: 'sepolia' }}>
      <Component {...pageProps} />
    </FhevmProvider>
  )
}
