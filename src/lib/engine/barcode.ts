import { BarcodeDecodeResult } from '@/types/lottery';

/**
 * High-accuracy barcode / QR payload inspector for Kerala lottery tickets.
 * 
 * Inspects payload without guessing:
 * - Direct Series + 6 Digits e.g. "MU422635" or "MU 422635" -> HIGH confidence
 * - Direct 6 Digits e.g. "422635" -> MEDIUM confidence (needs series confirmation)
 * - Known official URL formats containing ticket query parameters -> parses query params
 * - Encoded checksum strings or internal stock IDs that cannot be reliably decoded -> UNIDENTIFIED
 * 
 * Never guesses digits.
 */
export function decodeBarcode(payload: string, format: string = 'UNKNOWN'): BarcodeDecodeResult {
  const raw = (payload || '').trim();

  if (!raw) {
    return {
      rawPayload: raw,
      series: null,
      ticketNumber: null,
      confidence: 'UNIDENTIFIED',
      format,
      errorMessage: 'Empty barcode payload detected.'
    };
  }

  // 1. Check if the payload is a URL (e.g., official verification link or vendor portal)
  if (raw.startsWith('http://') || raw.startsWith('https://')) {
    try {
      const url = new URL(raw);
      // Check query params like ?ticket=MU422635 or ?t=422635&s=MU
      const tParam = url.searchParams.get('ticket') || url.searchParams.get('t') || url.searchParams.get('num');
      const sParam = url.searchParams.get('series') || url.searchParams.get('s');

      if (tParam) {
        const cleanT = tParam.toUpperCase().replace(/[^A-Z0-9]/g, '');
        const match = cleanT.match(/^([A-Z]{1,3})?(\d{6})$/);
        if (match) {
          const series = sParam ? sParam.toUpperCase() : (match[1] || null);
          return {
            rawPayload: raw,
            series,
            ticketNumber: match[2],
            confidence: series ? 'HIGH' : 'MEDIUM',
            format: 'QR_URL'
          };
        }
      }
    } catch {
      // Not a valid URL, continue to string patterns
    }
  }

  // 2. Direct Series + 6 Digits (e.g., "MU 422635", "WA-789012", "BR99123456")
  const seriesNumberRegex = /^([A-Z]{1,3})[\s\-_]?(\d{6})$/i;
  const matchSeries = raw.match(seriesNumberRegex);
  if (matchSeries) {
    return {
      rawPayload: raw,
      series: matchSeries[1].toUpperCase(),
      ticketNumber: matchSeries[2],
      confidence: 'HIGH',
      format
    };
  }

  // 3. Direct 6 Digits alone (e.g. "422635")
  if (/^\d{6}$/.test(raw)) {
    return {
      rawPayload: raw,
      series: null,
      ticketNumber: raw,
      confidence: 'MEDIUM',
      format
    };
  }

  // 4. Extended payload with delimiter (e.g. "LOTIS|KN-642|MU|422635|2026-09-24")
  if (raw.includes('|') || raw.includes(':') || raw.includes(';')) {
    const parts = raw.split(/[|:;]/).map(p => p.trim());
    for (let i = 0; i < parts.length; i++) {
      const p = parts[i].toUpperCase();
      // Look for a 6-digit chunk
      if (/^\d{6}$/.test(p)) {
        // Look for adjacent series
        const prevPart = parts[i - 1]?.toUpperCase();
        const nextPart = parts[i + 1]?.toUpperCase();
        let series: string | null = null;
        if (prevPart && /^[A-Z]{1,3}$/.test(prevPart)) series = prevPart;
        else if (nextPart && /^[A-Z]{1,3}$/.test(nextPart)) series = nextPart;

        return {
          rawPayload: raw,
          series,
          ticketNumber: p,
          confidence: series ? 'HIGH' : 'MEDIUM',
          format
        };
      }
    }
  }

  // 5. If payload cannot be safely and unambiguously identified
  return {
    rawPayload: raw,
    series: null,
    ticketNumber: null,
    confidence: 'UNIDENTIFIED',
    format,
    errorMessage: 'Barcode detected, but the ticket number could not be safely identified. Please enter ticket details manually.'
  };
}
