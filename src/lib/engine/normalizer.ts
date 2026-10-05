import { NormalizedTicket } from '@/types/lottery';

/**
 * Normalizes and strictly validates user input for Kerala State Lottery tickets.
 * 
 * Rules:
 * - Never silently change or invent digits.
 * - If digit count is not 6, reject with explicit error.
 * - Preserves raw input for auditability.
 * - Extracts uppercase series code and exact 6-digit number.
 */
export function normalizeTicket(
  rawInput: string,
  allowedSeries?: string[]
): NormalizedTicket {
  const trimmed = (rawInput || '').trim();

  if (!trimmed) {
    return {
      raw_input: rawInput,
      normalized_series: '',
      normalized_number: '',
      normalized_full_ticket: '',
      valid: false,
      error: 'Please enter a ticket number.'
    };
  }

  // Remove common separators like hyphens, dots, underscores, extra spaces
  // Pattern 1: Separate series and digits e.g. "MU 422635", "MU-422635", "mu 422635"
  // Pattern 2: Combined series and digits e.g. "MU422635", "mu422635"
  // Pattern 3: Number only e.g. "422635" (if series was provided in separate field)

  // Extract letters and digits
  const cleanStr = trimmed.toUpperCase().replace(/[^A-Z0-9]/g, '');

  const match = cleanStr.match(/^([A-Z]{1,3})?(\d+)$/);

  if (!match) {
    return {
      raw_input: rawInput,
      normalized_series: '',
      normalized_number: '',
      normalized_full_ticket: '',
      valid: false,
      error: 'Invalid ticket format. Kerala tickets contain 1-3 series letters and a 6-digit number (e.g., MU 422635).'
    };
  }

  const series = match[1] || '';
  const number = match[2];

  // Strictly enforce 6-digit ticket numbers for Kerala State Lotteries
  if (number.length !== 6) {
    return {
      raw_input: rawInput,
      normalized_series: series,
      normalized_number: number,
      normalized_full_ticket: series ? `${series} ${number}` : number,
      valid: false,
      error: `Kerala lottery numbers must contain exactly 6 digits. You entered ${number.length} digits (${number}).`
    };
  }

  // If draw series are known and series was provided, check membership
  if (series && allowedSeries && allowedSeries.length > 0) {
    const isAllowed = allowedSeries.some(s => s.toUpperCase() === series);
    if (!isAllowed) {
      return {
        raw_input: rawInput,
        normalized_series: series,
        normalized_number: number,
        normalized_full_ticket: `${series} ${number}`,
        valid: false,
        error: `Series "${series}" is not part of this draw's series list (${allowedSeries.join(', ')}).`
      };
    }
  }

  const fullTicket = series ? `${series} ${number}` : number;

  return {
    raw_input: rawInput,
    normalized_series: series,
    normalized_number: number,
    normalized_full_ticket: fullTicket,
    valid: true
  };
}
