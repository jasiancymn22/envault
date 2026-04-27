/**
 * Crypto module for envault.
 * Provides encryption, decryption, and key derivation utilities
 * for securely storing and retrieving environment variables.
 */
export {
  encrypt,
  decrypt,
  deriveKey,
  serializePayload,
  deserializePayload,
} from './encryption';
export type { EncryptedPayload } from './encryption';
