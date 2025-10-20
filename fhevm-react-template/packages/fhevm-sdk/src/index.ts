/**
 * Universal FHEVM SDK
 * Framework-agnostic SDK for building confidential frontends
 */

// Core exports (framework-agnostic)
export * from './core'

// React exports (optional)
export * from './react'

// Type exports
export type {
  FhevmConfig,
  FhevmInstance,
  EncryptionType,
  DecryptOptions
} from './core'

export type {
  FhevmProviderProps,
  FhevmContextValue,
  UseFhevmInstanceReturn,
  UseEncryptReturn,
  UseDecryptReturn
} from './react'
