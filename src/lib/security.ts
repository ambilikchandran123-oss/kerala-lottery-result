import crypto from 'crypto';
import path from 'path';

/**
 * Constant-time string comparison to prevent timing attacks.
 */
export function timingSafeCompare(a: string | null | undefined, b: string | null | undefined): boolean {
  if (!a || !b) return false;
  const bufA = Buffer.from(a, 'utf-8');
  const bufB = Buffer.from(b, 'utf-8');
  if (bufA.length !== bufB.length) {
    // Perform dummy comparison of equal length to avoid timing discrepancy
    crypto.timingSafeEqual(bufA, bufA);
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * Strictly sanitizes filenames to prevent Directory Traversal (LFI/RFI/overwrites).
 * Strips path separators, null bytes, control characters, and ensures safe alphanumeric + hyphen/underscore names.
 */
export function sanitizeFilename(rawFilename: string, defaultExt: string = '.pdf'): string {
  // Extract basename only
  let base = path.basename(rawFilename).replace(/\0/g, '').trim();

  // Extract extension
  const ext = path.extname(base).toLowerCase();
  const allowedExts = ['.pdf', '.txt', '.json'];
  const finalExt = allowedExts.includes(ext) ? ext : defaultExt;

  // Clean the name part
  const namePart = base.slice(0, base.length - (ext ? ext.length : 0))
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .slice(0, 80);

  const cleanName = (namePart || `result_${Date.now()}`) + finalExt;
  return cleanName;
}

/**
 * Validates that an upload is within safe file size limits (default 10 MB max).
 */
export function validateFileSize(buffer: Buffer, maxBytes: number = 10 * 1024 * 1024): boolean {
  return buffer.length <= maxBytes;
}

/**
 * Validates PDF magic header bytes (%PDF-) to prevent malicious non-PDF uploads.
 */
export function validatePdfMagicBytes(buffer: Buffer): boolean {
  if (buffer.length < 5) return false;
  // %PDF- in ASCII is [0x25, 0x50, 0x44, 0x46, 0x2D]
  return (
    buffer[0] === 0x25 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x44 &&
    buffer[3] === 0x46 &&
    buffer[4] === 0x2d
  );
}

/**
 * Sanitizes generic alphanumeric identifiers (draw ID, lottery code, series).
 */
export function sanitizeIdentifier(input: string, maxLen: number = 64): string {
  if (!input || typeof input !== 'string') return '';
  return input.trim().replace(/[^a-zA-Z0-9_-]/g, '').slice(0, maxLen);
}

/**
 * Sanitizes ticket numbers (strictly 6 digits).
 */
export function sanitizeTicketNumber(input: string): string {
  if (!input || typeof input !== 'string') return '';
  const digits = input.replace(/\D/g, '');
  return digits.slice(0, 6);
}

/**
 * Sanitizes ticket series (strictly 1 to 3 uppercase alphabetic characters).
 */
export function sanitizeTicketSeries(input: string): string {
  if (!input || typeof input !== 'string') return '';
  return input.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 3);
}
