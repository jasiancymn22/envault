import { deflateSync, inflateSync } from 'zlib';

export interface CompressedPayload {
  compressed: boolean;
  data: string;
  originalSize: number;
  compressedSize: number;
}

/**
 * Compresses a string using zlib deflate and returns a base64-encoded payload.
 */
export function compressData(input: string): CompressedPayload {
  const inputBuffer = Buffer.from(input, 'utf-8');
  const compressed = deflateSync(inputBuffer);
  const data = compressed.toString('base64');
  return {
    compressed: true,
    data,
    originalSize: inputBuffer.byteLength,
    compressedSize: compressed.byteLength,
  };
}

/**
 * Decompresses a base64-encoded zlib-deflated string.
 */
export function decompressData(payload: CompressedPayload): string {
  if (!payload.compressed) {
    return payload.data;
  }
  const buffer = Buffer.from(payload.data, 'base64');
  const decompressed = inflateSync(buffer);
  return decompressed.toString('utf-8');
}

/**
 * Serializes a CompressedPayload to a JSON string.
 */
export function serializeCompressed(payload: CompressedPayload): string {
  return JSON.stringify(payload);
}

/**
 * Deserializes a JSON string into a CompressedPayload.
 */
export function deserializeCompressed(raw: string): CompressedPayload {
  const parsed = JSON.parse(raw);
  if (
    typeof parsed.compressed !== 'boolean' ||
    typeof parsed.data !== 'string' ||
    typeof parsed.originalSize !== 'number' ||
    typeof parsed.compressedSize !== 'number'
  ) {
    throw new Error('Invalid compressed payload format');
  }
  return parsed as CompressedPayload;
}

/**
 * Returns a human-readable compression ratio string.
 */
export function compressionRatio(payload: CompressedPayload): string {
  if (payload.originalSize === 0) return '0%';
  const ratio = ((1 - payload.compressedSize / payload.originalSize) * 100).toFixed(1);
  return `${ratio}%`;
}
