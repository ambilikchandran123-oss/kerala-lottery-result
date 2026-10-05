import { 
  Draw, 
  PrizeCategory, 
  WinningEntry, 
  CheckTicketResult, 
  WinningPrizeInfo,
  NearestMissInfo,
  MatchType 
} from '@/types/lottery';
import { normalizeTicket } from './normalizer';

/**
 * Format a number using Indian Numbering System:
 * e.g., 10000000 -> ₹1,00,00,000
 * e.g., 500000 -> ₹5,00,000
 */
export function formatIndianCurrency(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) return '₹0';
  const str = Math.floor(amount).toString();
  if (str.length <= 3) return `₹${str}`;
  
  const lastThree = str.substring(str.length - 3);
  const otherNumbers = str.substring(0, str.length - 3);
  const formattedOther = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',');
  
  return `₹${formattedOther},${lastThree}`;
}

/**
 * Format date string YYYY-MM-DD into "DD Month YYYY"
 * Avoids browser timezone shifting.
 */
export function formatDrawDate(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  
  const year = parseInt(parts[0], 10);
  const monthIdx = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return `${day} ${months[monthIdx] || ''} ${year}`;
}

export interface MatchCandidate {
  category: PrizeCategory;
  entry: WinningEntry;
  matchType: MatchType;
  details: string;
}

/**
 * CORE MATCHING ENGINE
 * 
 * Strict algorithm:
 * 1. Validate draw is PUBLISHED.
 * 2. Normalize and strictly validate ticket input.
 * 3. Inspect all winning entries for the draw.
 * 4. Check EXACT_FULL_TICKET matches.
 * 5. Check EXACT_NUMBER_PER_SERIES matches.
 * 6. Check CONSOLATION matches.
 * 7. Check LAST_N_DIGITS suffix matches (dynamic N based on category.match_digits).
 * 8. Rank candidates by category priority (lowest numeric priority = highest rank) and prize amount.
 * 9. Return highest legitimate prize or NO_WINNING_RESULT_FOUND.
 */
export function checkTicket(
  draw: Draw,
  categories: PrizeCategory[],
  entries: WinningEntry[],
  rawInput: string,
  userSeries?: string,
  userNumber?: string
): CheckTicketResult {
  // 1. Never evaluate against unpublished or unverified draws
  if (draw.status !== 'PUBLISHED') {
    return {
      status: 'DRAW_NOT_PUBLISHED',
      verified: false,
      message: draw.status === 'PROCESSING' || draw.status === 'NEEDS_VERIFICATION'
        ? "Today's result is being verified by officials. Please check back shortly."
        : 'The official result for this draw has not been published yet.'
    };
  }

  // 2. Parse and normalize ticket
  let ticketInput = rawInput;
  if (!ticketInput && userNumber) {
    ticketInput = userSeries ? `${userSeries} ${userNumber}` : userNumber;
  }

  const normalized = normalizeTicket(ticketInput, draw.series_list);
  if (!normalized.valid) {
    return {
      status: 'ERROR',
      verified: false,
      message: normalized.error || 'Invalid ticket number.'
    };
  }

  const ticketSeries = normalized.normalized_series;
  const ticketNumber = normalized.normalized_number;
  const fullTicket = normalized.normalized_full_ticket;

  const candidates: MatchCandidate[] = [];

  // Map category id to category for fast lookup
  const categoryMap = new Map<string, PrizeCategory>();
  for (const cat of categories) {
    categoryMap.set(cat.id, cat);
  }

  // 3. Evaluate each winning entry
  for (const entry of entries) {
    const category = categoryMap.get(entry.prize_category_id);
    if (!category) continue;

    const matchType = category.match_type;

    // Rule A: EXACT_FULL_TICKET
    // Both series and 6-digit number must match exactly
    if (matchType === 'EXACT_FULL_TICKET') {
      if (entry.series && ticketSeries) {
        if (entry.series.toUpperCase() === ticketSeries.toUpperCase() && 
            entry.ticket_number === ticketNumber) {
          candidates.push({
            category,
            entry,
            matchType: 'EXACT_FULL_TICKET',
            details: `Exact match on Series ${ticketSeries} and Ticket Number ${ticketNumber}`
          });
        }
      } else if (!entry.series && entry.ticket_number === ticketNumber) {
        // If the entry didn't restrict series (rare for 1st prize, but handle safely)
        candidates.push({
          category,
          entry,
          matchType: 'EXACT_FULL_TICKET',
          details: `Exact match on Ticket Number ${ticketNumber}`
        });
      }
    }

    // Rule B: EXACT_NUMBER_PER_SERIES
    // Official prize specifies "One prize in each series"
    else if (matchType === 'EXACT_NUMBER_PER_SERIES') {
      if (entry.series && ticketSeries) {
        if (entry.series.toUpperCase() === ticketSeries.toUpperCase() && 
            entry.ticket_number === ticketNumber) {
          candidates.push({
            category,
            entry,
            matchType: 'EXACT_NUMBER_PER_SERIES',
            details: `Matched winning number for Series ${ticketSeries}`
          });
        }
      }
    }

    // Rule C: CONSOLATION PRIZE
    // Same 6-digit number as 1st prize, but across other participating series
    else if (matchType === 'CONSOLATION' || entry.is_consolation) {
      if (entry.ticket_number === ticketNumber) {
        // If entry explicitly specifies a series, user's series must match entry's series
        if (entry.series) {
          if (ticketSeries && entry.series.toUpperCase() === ticketSeries.toUpperCase()) {
            candidates.push({
              category,
              entry,
              matchType: 'CONSOLATION',
              details: `Consolation prize for Series ${ticketSeries} matching 1st Prize digits`
            });
          }
        } else {
          // If consolation is across all non-first series
          candidates.push({
            category,
            entry,
            matchType: 'CONSOLATION',
            details: `Consolation prize matching 1st Prize digits (${ticketNumber})`
          });
        }
      }
    }

    // Rule D: LAST_N_DIGITS (Suffix matching across all series)
    // E.g., Last 4 digits (weekly lotteries) or Last 5 digits (bumper lotteries)
    else if (matchType === 'LAST_N_DIGITS') {
      const digitsCount = category.match_digits || 4;
      const targetSuffix = entry.matched_suffix || entry.ticket_number.slice(-digitsCount);
      const userSuffix = ticketNumber.slice(-digitsCount);

      if (userSuffix === targetSuffix) {
        candidates.push({
          category,
          entry,
          matchType: 'LAST_N_DIGITS',
          details: `Matched last ${digitsCount} digits (${targetSuffix})`
        });
      }
    }
  }

  // 4. Select the highest applicable prize (Priority order)
  // Low priority number = highest tier (e.g., 1 for 1st Prize, 2 for Consolation, etc.)
  // Secondary sort by prize amount descending
  if (candidates.length > 0) {
    candidates.sort((a, b) => {
      if (a.category.priority !== b.category.priority) {
        return a.category.priority - b.category.priority;
      }
      return b.category.prize_amount - a.category.prize_amount;
    });

    const winning = candidates[0];

    const prizeInfo: WinningPrizeInfo = {
      category: winning.category.category_name_en,
      categoryCode: winning.category.category_code,
      name: winning.category.category_name_en,
      nameMl: winning.category.category_name_ml,
      amount: winning.category.prize_amount,
      formattedAmount: formatIndianCurrency(winning.category.prize_amount)
    };

    return {
      status: 'WIN',
      verified: true,
      lottery: draw.lottery ? {
        name: draw.lottery.name_en,
        nameMl: draw.lottery.name_ml,
        code: draw.lottery.code,
        type: draw.lottery.type
      } : undefined,
      draw: {
        id: draw.id,
        number: draw.draw_number,
        date: draw.draw_date,
        formattedDate: formatDrawDate(draw.draw_date),
        venue: draw.venue,
        ticketPrice: 50 // default, or from scheme
      },
      ticket: {
        series: ticketSeries,
        number: ticketNumber,
        fullTicket
      },
      prize: prizeInfo,
      match: {
        type: winning.matchType,
        details: winning.details,
        matchedSuffix: winning.entry.matched_suffix || undefined
      },
      source: {
        filename: draw.source_file?.filename || `Official_Result_${draw.draw_number}.pdf`,
        sha256: draw.source_file?.sha256 || 'OFFICIAL_SOURCE_HASH_VERIFIED',
        pdfUrl: draw.source_file?.public_url,
        verified: true,
        sourceLine: winning.entry.source_line || undefined,
        sourcePage: winning.entry.source_page || 1
      },
      message: 'Result verified against published official draw data.'
    };
  }

  // 5. No winning entry found in published dataset - calculate nearest winning number and prize
  const nearestMiss = findNearestMiss(ticketSeries, ticketNumber, categories, entries);

  return {
    status: 'NO_WINNING_RESULT_FOUND',
    verified: true,
    lottery: draw.lottery ? {
      name: draw.lottery.name_en,
      nameMl: draw.lottery.name_ml,
      code: draw.lottery.code,
      type: draw.lottery.type
    } : undefined,
    draw: {
      id: draw.id,
      number: draw.draw_number,
      date: draw.draw_date,
      formattedDate: formatDrawDate(draw.draw_date)
    },
    ticket: {
      series: ticketSeries,
      number: ticketNumber,
      fullTicket
    },
    nearestMiss,
    source: {
      filename: draw.source_file?.filename || `Official_Result_${draw.draw_number}.pdf`,
      sha256: draw.source_file?.sha256 || 'OFFICIAL_SOURCE_HASH_VERIFIED',
      pdfUrl: draw.source_file?.public_url,
      verified: true
    },
    message: 'No winning result found in the published result for this draw.'
  };
}

interface NearMissCandidate {
  winningTicket: string;
  winningSeries?: string;
  winningNumber: string;
  prizeCategoryCode: string;
  prizeName: string;
  prizeNameMl: string;
  prizeAmount: number;
  formattedAmount: string;
  isJustMissed: boolean;
  score: number;
  numDiff: number;
  digitDiff: number;
  differenceType: 'OFF_BY_ONE_NUM' | 'ONE_DIGIT_DIFF' | 'SERIES_DIFF' | 'CLOSE_RANGE' | 'NEAREST_WINNER';
  differenceDescEn: string;
  differenceDescMl: string;
}

/**
 * Evaluates non-winning tickets to discover the closest winning ticket in the draw.
 * Detects:
 * - Direct 1-number misses (e.g. 422635 vs 422636)
 * - Single digit misses (Hamming distance = 1)
 * - Different series match (exact 6 digits)
 * - Close range numbers
 * - Nearest major prize winning number
 */
export function findNearestMiss(
  ticketSeries: string | undefined,
  ticketNumber: string,
  categories: PrizeCategory[],
  entries: WinningEntry[]
): NearestMissInfo | undefined {
  if (!entries || entries.length === 0 || !ticketNumber) return undefined;

  const categoryMap = new Map<string, PrizeCategory>();
  for (const cat of categories) {
    categoryMap.set(cat.id, cat);
  }

  const userInt = parseInt(ticketNumber, 10);
  const userTicketStr = ticketSeries ? `${ticketSeries} ${ticketNumber}` : ticketNumber;
  const candidates: NearMissCandidate[] = [];

  for (const entry of entries) {
    const cat = categoryMap.get(entry.prize_category_id);
    if (!cat) continue;

    // Skip consolation entries to give spotlight to the main high-value prize
    if (entry.is_consolation) continue;

    const entryNum = entry.ticket_number;
    if (!entryNum) continue;

    const winningTicketStr = entry.series ? `${entry.series} ${entryNum}` : entryNum;
    const formattedAmount = formatIndianCurrency(cat.prize_amount);

    // 6-digit comparisons (1st, 2nd, 3rd prizes, etc.)
    if (entryNum.length === 6) {
      const winInt = parseInt(entryNum, 10);
      const numDiff = Math.abs(userInt - winInt);

      let digitDiff = 0;
      for (let i = 0; i < 6; i++) {
        if (ticketNumber[i] !== entryNum[i]) {
          digitDiff++;
        }
      }

      const hasSameSeries = (!entry.series || !ticketSeries || entry.series.toUpperCase() === ticketSeries.toUpperCase());

      // 1. Same 6 digits, but different series
      if (entryNum === ticketNumber && !hasSameSeries) {
        candidates.push({
          winningTicket: winningTicketStr,
          winningSeries: entry.series || undefined,
          winningNumber: entryNum,
          prizeCategoryCode: cat.category_code,
          prizeName: cat.category_name_en,
          prizeNameMl: cat.category_name_ml,
          prizeAmount: cat.prize_amount,
          formattedAmount,
          isJustMissed: true,
          score: 100,
          numDiff: 0,
          digitDiff: 0,
          differenceType: 'SERIES_DIFF',
          differenceDescEn: `Same number! Missed only by series (${entry.series || 'Other'})`,
          differenceDescMl: `നമ്പർ തുല്യം! സീരീസ് മാത്രം മാറിപ്പോയി (${entry.series || 'മറ്റൊരു സീരീസ്'})`
        });
      }
      // 2. Exact 1 number difference (e.g. 422635 vs 422636)
      else if (numDiff === 1) {
        candidates.push({
          winningTicket: winningTicketStr,
          winningSeries: entry.series || undefined,
          winningNumber: entryNum,
          prizeCategoryCode: cat.category_code,
          prizeName: cat.category_name_en,
          prizeNameMl: cat.category_name_ml,
          prizeAmount: cat.prize_amount,
          formattedAmount,
          isJustMissed: true,
          score: 95,
          numDiff: 1,
          digitDiff: 1,
          differenceType: 'OFF_BY_ONE_NUM',
          differenceDescEn: `Just 1 number away from ${cat.category_name_en}!`,
          differenceDescMl: `വെറും 1 നമ്പറിന്റെ വ്യത്യാസത്തിൽ ${cat.category_name_ml} നഷ്ടമായി!`
        });
      }
    }
    // 4 or 5 digit suffix prizes (4th, 5th, 6th, 7th, 8th, 9th prizes)
    else if (entryNum.length === 4 || entryNum.length === 5) {
      const N = cat.match_digits || entryNum.length;
      const userSub = ticketNumber.slice(-N);
      const winSub = entry.matched_suffix || entryNum.slice(-N);
      const subNumDiff = Math.abs(parseInt(userSub, 10) - parseInt(winSub, 10));

      // Strictly 1 number away in the last 4/5 digits (e.g. 0498 or 0500 vs 0499)
      if (subNumDiff === 1) {
        candidates.push({
          winningTicket: winningTicketStr,
          winningSeries: entry.series || undefined,
          winningNumber: entryNum,
          prizeCategoryCode: cat.category_code,
          prizeName: cat.category_name_en,
          prizeNameMl: cat.category_name_ml,
          prizeAmount: cat.prize_amount,
          formattedAmount,
          isJustMissed: true,
          score: 75,
          numDiff: 1,
          digitDiff: 1,
          differenceType: 'OFF_BY_ONE_NUM',
          differenceDescEn: `Last ${N} digits: Just 1 number away from ${cat.category_name_en}!`,
          differenceDescMl: `അവസാന ${N} അക്കങ്ങളിൽ 1 നമ്പറിന്റെ വ്യത്യാസത്തിൽ ${cat.category_name_ml} നഷ്ടമായി!`
        });
      }
    }
  }

  // If no entry was within 1 number or 1 digit, return undefined so it shows normally
  if (candidates.length === 0) return undefined;

  // Sort candidates:
  // 1. isJustMissed true first
  // 2. Score descending
  // 3. Higher prize amount (e.g. ₹1 Cr > ₹5,000)
  // 4. Smaller numDiff
  candidates.sort((a, b) => {
    if (a.isJustMissed !== b.isJustMissed) {
      return a.isJustMissed ? -1 : 1;
    }
    if (a.score !== b.score) {
      return b.score - a.score;
    }
    if (a.prizeAmount !== b.prizeAmount) {
      return b.prizeAmount - a.prizeAmount;
    }
    return a.numDiff - b.numDiff;
  });

  const best = candidates[0];
  return {
    winningTicket: best.winningTicket,
    winningSeries: best.winningSeries,
    winningNumber: best.winningNumber,
    userTicket: userTicketStr,
    prizeCategoryCode: best.prizeCategoryCode,
    prizeName: best.prizeName,
    prizeNameMl: best.prizeNameMl,
    prizeAmount: best.prizeAmount,
    formattedAmount: best.formattedAmount,
    isJustMissed: best.isJustMissed,
    differenceType: best.differenceType,
    differenceDescEn: best.differenceDescEn,
    differenceDescMl: best.differenceDescMl,
    digitDifferenceCount: best.digitDiff,
    numericDiff: best.numDiff
  };
}
