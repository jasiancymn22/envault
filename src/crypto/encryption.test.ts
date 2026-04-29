import { describe, it, expect } from 'vitest';
import {
  encrypt,
  decrypt,
  serializePayload,
  deserializePayload,
  deriveKey,
} from './encryption';

const PASSWORD = 'super-secret-password-123';
const PLAINTEXT = 'API_KEY=abc123\nDB_URL=postgres://localhost/mydb\nSECRET=xyz';

describe('encryption', () => {
  it('encrypts and decrypts plaintext correctly', () => {
    const payload = encrypt(PLAINTEXT, PASSWORD);
    const result = decrypt(payload, PASSWORD);
    expect(result).toBe(PLAINTEXT);
  });

  it('produces different ciphertext on each encryption (random IV/salt)', () => {
    const payload1 = encrypt(PLAINTEXT, PASSWORD);
    const payload2 = encrypt(PLAINTEXT, PASSWORD);
    expect(payload1.data).not.toBe(payload2.data);
    expect(payload1.iv).not.toBe(payload2.iv);
    expect(payload1.salt).not.toBe(payload2.salt);
  });

  it('throws when decrypting with wrong password', () => {
    const payload = encrypt(PLAINTEXT, PASSWORD);
    expect(() => decrypt(payload, 'wrong-password')).toThrow();
  });

  it('throws when ciphertext is tampered', () => {
    const payload = encrypt(PLAINTEXT, PASSWORD);
    const tampered = { ...payload, data: payload.data.slice(0, -4) + 'ffff' };
    expect(() => decrypt(tampered, PASSWORD)).toThrow();
  });

  it('throws when IV is tampered', () => {
    const payload = encrypt(PLAINTEXT, PASSWORD);
    const tampered = { ...payload, iv: 'ff'.repeat(payload.iv.length / 2) };
    expect(() => decrypt(tampered, PASSWORD)).toThrow();
  });

  it('serializes and deserializes payload correctly', () => {
    const payload = encrypt(PLAINTEXT, PASSWORD);
    const serialized = serializePayload(payload);
    const deserialized = deserializePayload(serialized);
    expect(deserialized).toEqual(payload);
  });

  it('roundtrips through serialize/deserialize and still decrypts', () => {
    const payload = encrypt(PLAINTEXT, PASSWORD);
    const serialized = serializePayload(payload);
    const deserialized = deserializePayload(serialized);
    const result = decrypt(deserialized, PASSWORD);
    expect(result).toBe(PLAINTEXT);
  });

  it('derives consistent key from same password and salt', () => {
    const salt = Buffer.from('a'.repeat(32), 'hex');
    const key1 = deriveKey(PASSWORD, salt);
    const key2 = deriveKey(PASSWORD, salt);
    expect(key1.equals(key2)).toBe(true);
  });

  it('derives different keys from different salts', () => {
    const salt1 = Buffer.from('a'.repeat(32), 'hex');
    const salt2 = Buffer.from('b'.repeat(32), 'hex');
    const key1 = deriveKey(PASSWORD, salt1);
    const key2 = deriveKey(PASSWORD, salt2);
    expect(key1.equals(key2)).toBe(false);
  });
});
