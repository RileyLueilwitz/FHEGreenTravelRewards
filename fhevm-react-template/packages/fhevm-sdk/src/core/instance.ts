/**
 * FHEVM Instance Management
 * Creates and manages FHEVM instances for encryption/decryption
 */

import { createInstance, FhevmInstance as FhevmJsInstance } from 'fhevmjs'

export interface FhevmConfig {
  network: 'sepolia' | 'local' | 'mainnet'
  gatewayUrl?: string
  contractAddress?: string
  aclAddress?: string
  publicKey?: string
}

export interface FhevmInstance {
  instance: FhevmJsInstance
  config: FhevmConfig
  publicKey: string
  isReady: boolean
}

let globalInstance: FhevmInstance | null = null

/**
 * Create FHEVM instance for encryption/decryption operations
 * @param config - Configuration options
 * @returns FHEVM instance
 */
export async function createFhevmInstance(
  config: FhevmConfig
): Promise<FhevmInstance> {
  // Return cached instance if already created
  if (globalInstance && globalInstance.config.network === config.network) {
    return globalInstance
  }

  // Default gateway URLs
  const defaultGatewayUrls: Record<string, string> = {
    sepolia: 'https://gateway.sepolia.zama.ai',
    local: 'http://localhost:8545',
    mainnet: 'https://gateway.zama.ai'
  }

  const gatewayUrl = config.gatewayUrl || defaultGatewayUrls[config.network]

  // Create fhevmjs instance
  const instance = await createInstance({
    chainId: config.network === 'sepolia' ? 11155111 : 1337,
    publicKey: config.publicKey,
    gatewayUrl
  })

  // Extract public key
  const publicKey = instance.getPublicKey()

  const fhevmInstance: FhevmInstance = {
    instance,
    config,
    publicKey: Buffer.from(publicKey).toString('hex'),
    isReady: true
  }

  // Cache globally
  globalInstance = fhevmInstance

  return fhevmInstance
}

/**
 * Get existing FHEVM instance
 * @returns Cached FHEVM instance or null
 */
export function getFhevmInstance(): FhevmInstance | null {
  return globalInstance
}

/**
 * Reset FHEVM instance (useful for testing)
 */
export function resetFhevmInstance(): void {
  globalInstance = null
}
