import { createHash } from 'crypto';

/**
 * Calculates SHA-256 hash of a buffer or string.
 * Used to ensure provenance and prevent duplicate imports of official lottery result documents.
 */
export function calculateSha256(content: Buffer | Uint8Array | string): string {
  const hash = createHash('sha256');
  if (typeof content === 'string') {
    hash.update(content, 'utf8');
  } else {
    hash.update(content);
  }
  return hash.digest('hex');
}
