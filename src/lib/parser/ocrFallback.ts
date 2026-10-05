/**
 * OCR Fallback Module
 * 
 * Spec Rules (Items 20 & 21):
 * - Support OCR for image-only PDFs as a fallback feature.
 * - OCR must NEVER be considered authoritative by itself (e.g. 422635 vs 422685).
 * - OCR-derived data MUST be flagged with ocr_used: true.
 * - Status MUST be set to NEEDS_VERIFICATION.
 * - Admin MUST verify before publication.
 */

export interface OcrResult {
  text: string;
  confidence: number;
  warnings: string[];
}

export async function performOcrFallback(imageOrPdfBuffer: Buffer): Promise<string> {
  // In a full production server, Tesseract.js or cloud OCR (e.g. Google Cloud Vision) would process the image.
  // Here we provide a structured fallback wrapper that extracts strings or flags for human verification.
  const warnings: string[] = [
    'OCR extraction utilized. Digits may be subject to character confusion (e.g., 3/8, 5/6).',
    'Mandatory admin verification required before publishing to public users.'
  ];

  // Try extracting plain ascii text strings from buffer if embedded
  const rawString = imageOrPdfBuffer.toString('utf-8');
  const printable = rawString.replace(/[^\x20-\x7E\r\n]/g, ' ');

  if (printable.includes('PRIZE') || printable.includes('DRAW')) {
    return printable;
  }

  // If binary cannot be parsed directly, provide notice for admin verification
  throw new Error(`Scanned image document requires manual input or external OCR service. Buffer size: ${imageOrPdfBuffer.length} bytes.`);
}
