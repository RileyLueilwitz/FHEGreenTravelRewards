/**
 * React Hook: useEncrypt
 * Encrypt data in React components
 */

import { useState, useCallback } from 'react'
import { useFhevmInstance } from './useFhevmInstance'
import { encrypt as encryptCore, type EncryptionType } from '../../core'

export interface UseEncryptReturn {
  encrypt: (value: number | boolean | string, type: EncryptionType) => Promise<Uint8Array>
  isEncrypting: boolean
  error: Error | null
}

/**
 * Hook to encrypt data in React components
 * @returns Encrypt function, loading state, and error
 */
export function useEncrypt(): UseEncryptReturn {
  const { fhevm, isReady } = useFhevmInstance()
  const [isEncrypting, setIsEncrypting] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const encrypt = useCallback(
    async (value: number | boolean | string, type: EncryptionType): Promise<Uint8Array> => {
      if (!isReady || !fhevm) {
        throw new Error('FHEVM not ready')
      }

      setIsEncrypting(true)
      setError(null)

      try {
        const encrypted = await encryptCore(fhevm, value, type)
        return encrypted
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Encryption failed')
        setError(error)
        throw error
      } finally {
        setIsEncrypting(false)
      }
    },
    [fhevm, isReady]
  )

  return { encrypt, isEncrypting, error }
}
