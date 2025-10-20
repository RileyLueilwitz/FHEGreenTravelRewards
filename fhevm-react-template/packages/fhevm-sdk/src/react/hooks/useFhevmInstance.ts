/**
 * React Hook: useFhevmInstance
 * Get FHEVM instance in React components
 */

import { useContext } from 'react'
import { FhevmContext } from '../provider'

export interface UseFhevmInstanceReturn {
  fhevm: any | null
  isReady: boolean
  error: Error | null
}

/**
 * Hook to access FHEVM instance in React components
 * @returns FHEVM instance, ready state, and error
 */
export function useFhevmInstance(): UseFhevmInstanceReturn {
  const context = useContext(FhevmContext)

  if (!context) {
    throw new Error('useFhevmInstance must be used within FhevmProvider')
  }

  return {
    fhevm: context.fhevm,
    isReady: context.isReady,
    error: context.error
  }
}
