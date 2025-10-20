/**
 * React Provider: FhevmProvider
 * Provides FHEVM instance to React components
 */

import React, { createContext, useEffect, useState, type ReactNode } from 'react'
import { createFhevmInstance, type FhevmConfig, type FhevmInstance } from '../core'

export interface FhevmContextValue {
  fhevm: FhevmInstance | null
  isReady: boolean
  error: Error | null
}

export const FhevmContext = createContext<FhevmContextValue | null>(null)

export interface FhevmProviderProps {
  config: FhevmConfig
  children: ReactNode
}

/**
 * Provider component to wrap your React app
 * Initializes FHEVM instance and provides it to child components
 */
export function FhevmProvider({ config, children }: FhevmProviderProps) {
  const [fhevm, setFhevm] = useState<FhevmInstance | null>(null)
  const [isReady, setIsReady] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let mounted = true

    async function initializeFhevm() {
      try {
        const instance = await createFhevmInstance(config)

        if (mounted) {
          setFhevm(instance)
          setIsReady(true)
        }
      } catch (err) {
        if (mounted) {
          const error = err instanceof Error ? err : new Error('Failed to initialize FHEVM')
          setError(error)
          console.error('FHEVM initialization error:', error)
        }
      }
    }

    initializeFhevm()

    return () => {
      mounted = false
    }
  }, [config.network, config.gatewayUrl])

  const value: FhevmContextValue = {
    fhevm,
    isReady,
    error
  }

  return <FhevmContext.Provider value={value}>{children}</FhevmContext.Provider>
}
