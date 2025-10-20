/**
 * React Hook: useDecrypt
 * Decrypt data in React components
 */

import { useState, useCallback } from 'react'
import { useFhevmInstance } from './useFhevmInstance'
import { decrypt as decryptCore, type DecryptOptions } from '../../core'
import type { Contract } from 'ethers'

export interface UseDecryptReturn {
  decrypt: (contract: Contract, method: string, options?: DecryptOptions) => Promise<number | boolean | string>
  isDecrypting: boolean
  result: number | boolean | string | null
  error: Error | null
}

/**
 * Hook to decrypt data in React components
 * @returns Decrypt function, loading state, result, and error
 */
export function useDecrypt(): UseDecryptReturn {
  const { fhevm, isReady } = useFhevmInstance()
  const [isDecrypting, setIsDecrypting] = useState(false)
  const [result, setResult] = useState<number | boolean | string | null>(null)
  const [error, setError] = useState<Error | null>(null)

  const decrypt = useCallback(
    async (
      contract: Contract,
      method: string,
      options?: DecryptOptions
    ): Promise<number | boolean | string> => {
      if (!isReady || !fhevm) {
        throw new Error('FHEVM not ready')
      }

      setIsDecrypting(true)
      setError(null)

      try {
        const decrypted = await decryptCore(fhevm, contract, method, options)
        setResult(decrypted)
        return decrypted
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Decryption failed')
        setError(error)
        throw error
      } finally {
        setIsDecrypting(false)
      }
    },
    [fhevm, isReady]
  )

  return { decrypt, isDecrypting, result, error }
}
