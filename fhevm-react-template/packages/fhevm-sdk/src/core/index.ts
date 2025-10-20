/**
 * Core FHEVM SDK
 * Framework-agnostic encryption/decryption utilities
 */

export {
  createFhevmInstance,
  getFhevmInstance,
  resetFhevmInstance,
  type FhevmConfig,
  type FhevmInstance
} from './instance'

export {
  encrypt,
  encryptBatch,
  type EncryptionType
} from './encrypt'

export {
  decrypt,
  decryptBatch,
  type DecryptOptions
} from './decrypt'
