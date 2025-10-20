/**
 * FHEVM Decryption Utilities
 * Decrypt data from smart contracts
 */

import type { Contract } from 'ethers'
import type { FhevmInstance } from './instance'

export interface DecryptOptions {
  signature?: string
  publicKey?: string
  userAddress?: string
}

/**
 * Decrypt a value from smart contract
 * @param fhevm - FHEVM instance
 * @param contract - Ethers contract instance
 * @param method - Contract method name
 * @param options - Decryption options (for user decrypt)
 * @returns Decrypted value
 */
export async function decrypt(
  fhevm: FhevmInstance,
  contract: Contract,
  method: string,
  options?: DecryptOptions
): Promise<number | boolean | string> {
  if (!fhevm.isReady) {
    throw new Error('FHEVM instance not ready')
  }

  try {
    // Get encrypted value from contract
    const encryptedValue = await contract[method]()

    // If user decrypt (requires EIP-712 signature)
    if (options?.signature) {
      return await userDecrypt(fhevm, encryptedValue, options)
    }

    // Public decrypt (oracle-based)
    return await publicDecrypt(fhevm, encryptedValue)
  } catch (error) {
    throw new Error(`Decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * User decrypt with EIP-712 signature
 * Requires user's signature to decrypt their own data
 */
async function userDecrypt(
  fhevm: FhevmInstance,
  encryptedValue: any,
  options: DecryptOptions
): Promise<number | boolean | string> {
  const { instance } = fhevm

  // Verify signature is provided
  if (!options.signature || !options.userAddress) {
    throw new Error('User decrypt requires signature and userAddress')
  }

  // Request decryption with signature
  const decrypted = await instance.decrypt(encryptedValue, {
    signature: options.signature,
    publicKey: options.publicKey || fhevm.publicKey,
    address: options.userAddress
  })

  return decrypted
}

/**
 * Public decrypt via oracle
 * Uses Zama gateway for decryption
 */
async function publicDecrypt(
  fhevm: FhevmInstance,
  encryptedValue: any
): Promise<number | boolean | string> {
  const { instance } = fhevm

  // Request public decryption from gateway
  const decrypted = await instance.decrypt(encryptedValue)

  return decrypted
}

/**
 * Batch decrypt multiple values
 * @param fhevm - FHEVM instance
 * @param contract - Ethers contract instance
 * @param methods - Array of method names
 * @param options - Decryption options
 * @returns Array of decrypted values
 */
export async function decryptBatch(
  fhevm: FhevmInstance,
  contract: Contract,
  methods: string[],
  options?: DecryptOptions
): Promise<Array<number | boolean | string>> {
  const decrypted: Array<number | boolean | string> = []

  for (const method of methods) {
    const value = await decrypt(fhevm, contract, method, options)
    decrypted.push(value)
  }

  return decrypted
}
