import zlib from 'zlib';
import { parseLotteryResultText, ParseResult } from './txtParser';

/**
 * Extracts plain text directly from PDF stream objects and content operators.
 * Handles FlateDecode (deflate), uncompressed streams, Tj strings, TJ arrays, and hex strings.
 * This completely prevents failures caused by older pdf-parse xref table issues.
 */
export function extractTextFromPdfStreams(buffer: Buffer): string {
  let fullText = '';
  const content = buffer.toString('latin1');

  const streamRegex = /stream\r?\n([\s\S]*?)\r?\nendstream/g;
  let match: RegExpExecArray | null;

  while ((match = streamRegex.exec(content)) !== null) {
    const rawStream = match[1];
    let decompressed = '';

    try {
      const streamBuf = Buffer.from(rawStream, 'latin1');
      decompressed = zlib.inflateSync(streamBuf).toString('latin1');
    } catch {
      try {
        const streamBuf = Buffer.from(rawStream, 'latin1');
        decompressed = zlib.inflateRawSync(streamBuf).toString('latin1');
      } catch {
        decompressed = rawStream;
      }
    }

    // Match string literal inside parentheses followed by Tj, ', or "
    const tjRegex = /\((?:[^()\\]|\\.)*\)\s*(?:Tj|'|")/g;
    let tjMatch: RegExpExecArray | null;
    while ((tjMatch = tjRegex.exec(decompressed)) !== null) {
      const unescaped = tjMatch[0]
        .replace(/^\(/, '')
        .replace(/\)\s*(?:Tj|'|")$/, '')
        .replace(/\\\(/g, '(')
        .replace(/\\\)/g, ')')
        .replace(/\\\\/g, '\\');
      fullText += unescaped + '\n';
    }

    // Match arrays like [(str) 20 (str2)] TJ
    const arrayRegex = /\[([^\]]*)\]\s*TJ/g;
    let arrMatch: RegExpExecArray | null;
    while ((arrMatch = arrayRegex.exec(decompressed)) !== null) {
      const inner = arrMatch[1];
      const partRegex = /\((?:[^()\\]|\\.)*\)/g;
      let partMatch: RegExpExecArray | null;
      let linePart = '';
      while ((partMatch = partRegex.exec(inner)) !== null) {
        linePart += partMatch[0]
          .slice(1, -1)
          .replace(/\\\(/g, '(')
          .replace(/\\\)/g, ')')
          .replace(/\\\\/g, '\\');
      }
      if (linePart) {
        fullText += linePart + '\n';
      }
    }

    // Match hex strings like <4B4552414C41> Tj
    const hexRegex = /<([0-9a-fA-F]+)>\s*(?:Tj|'|")/g;
    let hexMatch: RegExpExecArray | null;
    while ((hexMatch = hexRegex.exec(decompressed)) !== null) {
      try {
        const decoded = Buffer.from(hexMatch[1], 'hex').toString('utf-8');
        fullText += decoded + '\n';
      } catch {
        // Ignore unparseable hex
      }
    }
  }

  return fullText.trim();
}

/**
 * Extracts text from PDF Buffer using pdf-parse with fallback to direct stream decompression.
 * Detects if the PDF is scanned/image-only and requires OCR.
 */
export async function parseLotteryResultPdf(
  buffer: Buffer,
  ocrFallbackFn?: (buf: Buffer) => Promise<string>
): Promise<ParseResult> {
  let extractedText = '';

  // 1. Try standard pdf-parse
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pdfParse = require('pdf-parse/lib/pdf-parse.js');
    const data = await pdfParse(buffer);
    extractedText = (data.text || '').trim();
  } catch (err: unknown) {
    console.warn('pdf-parse failed, falling back to direct stream parser:', err instanceof Error ? err.message : err);
  }

  // 2. If pdf-parse failed or returned insufficient text, use native stream parser
  if (extractedText.length < 50) {
    const streamText = extractTextFromPdfStreams(buffer);
    if (streamText.length > extractedText.length) {
      extractedText = streamText;
    }
  }

  // 3. If still fewer than 50 characters, check if OCR is available for scanned PDF
  if (extractedText.length < 50 && ocrFallbackFn) {
    try {
      const ocrText = await ocrFallbackFn(buffer);
      return parseLotteryResultText(ocrText, true);
    } catch (ocrErr: unknown) {
      console.warn('OCR fallback failed:', ocrErr);
    }
  }

  if (extractedText.length >= 20) {
    return parseLotteryResultText(extractedText, false);
  }

  return {
    success: false,
    lotteryNameEn: '',
    lotteryNameMl: '',
    lotteryCode: '',
    drawNumber: '',
    drawDate: '',
    venue: '',
    seriesList: [],
    categories: [],
    totalEntriesCount: 0,
    confidence: 'LOW',
    confidenceScore: 0,
    ocrUsed: false,
    warnings: [],
    errors: ['PDF contains no readable text. It may be a scanned image or corrupted file. Please paste the result text directly.'],
    rawText: extractedText
  };
}
