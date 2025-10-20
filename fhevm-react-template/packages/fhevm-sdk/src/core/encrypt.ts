/**
 * FHEVM Encryption Utilities
 * Encrypt data for smart contract submission
 */

import type { FhevmInstance } from './instance'

export type EncryptionType = 'uint8' | 'uint16' | 'uint32' | 'uint64' | 'bool' | 'address'

/**
 * Encrypt a value for smart contract submission
 * @param fhevm - FHEVM instance
 * @param value - Value to encrypt
 * @param type - Encryption type
 * @returns Encrypted bytes as Uint8Array
 */
export async function encrypt(
  fhevm: FhevmInstance,
  value: number | boolean | string,
  type: EncryptionType
): Promise<Uint8Array> {
  if (!fhevm.isReady) {
    throw new Error('FHEVM instance not ready')
  }

  const { instance } = fhevm

  try {
    switch (type) {
      case 'uint8':
        if (typeof value !== 'number' || value < 0 || value > 255) {
          throw new Error('uint8 requires number 0-255')
        }
        return instance.encrypt8(value)

      case 'uint16':
        if (typeof value !== 'number' || value < 0 || value > 65535) {
          throw new Error('uint16 requires number 0-65535')
        }
        return instance.encrypt16(value)

      case 'uint32':
        if (typeof value !== 'number' || value < 0 || value > 4294967295) {
          throw new Error('uint32 requires number 0-4294967295')
        }
        return instance.encrypt32(value)

      case 'uint64':
        if (typeof value !== 'number' || value < 0) {
          throw new Error('uint64 requires non-negative number')
        }
        return instance.encrypt64(BigInt(value))

      case 'bool':
        if (typeof value !== 'boolean') {
          throw new Error('bool requires boolean value')
        }
        return instance.encryptBool(value)

      case 'address':
        if (typeof value !== 'string' || !value.startsWith('0x')) {
          throw new Error('address requires hex string starting with 0x')
        }
        return instance.encryptAddress(value)

      default:
        throw new Error(`Unsupported encryption type: ${type}`)
    }
  } catch (error) {
    throw new Error(`Encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Batch encrypt multiple values
 * @param fhevm - FHEVM instance
 * @param values - Array of values with types
 * @returns Array of encrypted bytes
 */
export async function encryptBatch(
  fhevm: FhevmInstance,
  values: Array<{ value: number | boolean | string; type: EncryptionType }>
): Promise<Uint8Array[]> {
  const encrypted: Uint8Array[] = []

  for (const item of values) {
    const encryptedValue = await encrypt(fhevm, item.value, item.type)
    encrypted.push(encryptedValue)
  }

  return encrypted
}
