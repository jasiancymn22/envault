import {
  compressData,
  decompressData,
  serializeCompressed,
  deserializeCompressed,
  compressionRatio,
  CompressedPayload,
} from './compress';

const sampleData = `DB_HOST=localhost
DB_PORT=5432
DB_NAME=myapp
DB_USER=admin
DB_PASSWORD=supersecret
API_KEY=abc123xyz
SECRET_TOKEN=verylongsecrettokenvalue
`;

describe('compressData', () => {
  it('should return a CompressedPayload with compressed=true', () => {
    const result = compressData(sampleData);
    expect(result.compressed).toBe(true);
    expect(typeof result.data).toBe('string');
    expect(result.originalSize).toBe(Buffer.from(sampleData, 'utf-8').byteLength);
    expect(result.compressedSize).toBeGreaterThan(0);
  });

  it('should produce a smaller or equal output for repetitive data', () => {
    const repetitive = 'KEY=VALUE\n'.repeat(100);
    const result = compressData(repetitive);
    expect(result.compressedSize).toBeLessThan(result.originalSize);
  });
});

describe('decompressData', () => {
  it('should round-trip compress and decompress correctly', () => {
    const payload = compressData(sampleData);
    const restored = decompressData(payload);
    expect(restored).toBe(sampleData);
  });

  it('should return data as-is when compressed=false', () => {
    const payload: CompressedPayload = {
      compressed: false,
      data: 'raw string',
      originalSize: 10,
      compressedSize: 10,
    };
    expect(decompressData(payload)).toBe('raw string');
  });
});

describe('serializeCompressed / deserializeCompressed', () => {
  it('should serialize and deserialize a payload correctly', () => {
    const payload = compressData(sampleData);
    const serialized = serializeCompressed(payload);
    const deserialized = deserializeCompressed(serialized);
    expect(deserialized).toEqual(payload);
  });

  it('should throw on invalid payload format', () => {
    expect(() => deserializeCompressed('{"bad":true}')).toThrow(
      'Invalid compressed payload format'
    );
  });
});

describe('compressionRatio', () => {
  it('should return a percentage string', () => {
    const payload = compressData('KEY=VALUE\n'.repeat(50));
    const ratio = compressionRatio(payload);
    expect(ratio).toMatch(/^\d+(\.\d+)?%$/);
  });

  it('should return 0% for empty original size', () => {
    const payload: CompressedPayload = {
      compressed: true,
      data: '',
      originalSize: 0,
      compressedSize: 0,
    };
    expect(compressionRatio(payload)).toBe('0%');
  });
});
