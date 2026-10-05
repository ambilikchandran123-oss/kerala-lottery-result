import { MatchType } from '@/types/lottery';

export interface ExtractedEntry {
  series?: string;
  ticketNumber: string;
  fullTicket?: string;
  matchedSuffix?: string;
  isConsolation: boolean;
  sourceLine: number;
  sourcePage?: number;
}

export interface ExtractedCategory {
  categoryCode: string;
  nameEn: string;
  nameMl: string;
  amount: number;
  matchType: MatchType;
  matchDigits: number;
  seriesScope: string;
  priority: number;
  entries: ExtractedEntry[];
}

export interface ParseResult {
  success: boolean;
  lotteryNameEn: string;
  lotteryNameMl: string;
  lotteryCode: string;
  drawNumber: string;
  drawDate: string; // YYYY-MM-DD
  venue: string;
  seriesList: string[];
  categories: ExtractedCategory[];
  totalEntriesCount: number;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  confidenceScore: number;
  ocrUsed: boolean;
  warnings: string[];
  errors: string[];
  rawText: string;
}

export const LOTTERY_MAPPINGS: Record<string, { code: string; nameEn: string; nameMl: string; type: 'WEEKLY' | 'BUMPER' }> = {
  'KARUNYA PLUS': { code: 'KN', nameEn: 'Karunya Plus', nameMl: 'കാരുണ്യ പ്ലസ്', type: 'WEEKLY' },
  'WIN-WIN': { code: 'W', nameEn: 'Win-Win', nameMl: 'വിൻ-വിൻ', type: 'WEEKLY' },
  'WIN WIN': { code: 'W', nameEn: 'Win-Win', nameMl: 'വിൻ-വിൻ', type: 'WEEKLY' },
  'FIFTY-FIFTY': { code: 'FF', nameEn: 'Fifty-Fifty', nameMl: 'ഫിഫ്റ്റി-ഫിഫ്റ്റി', type: 'WEEKLY' },
  'FIFTY FIFTY': { code: 'FF', nameEn: 'Fifty-Fifty', nameMl: 'ഫിഫ്റ്റി-ഫിഫ്റ്റി', type: 'WEEKLY' },
  'STHREE SAKTHI': { code: 'SS', nameEn: 'Sthree Sakthi', nameMl: 'സ്ത്രീ ശക്തി', type: 'WEEKLY' },
  'STHREE-SAKTHI': { code: 'SS', nameEn: 'Sthree Sakthi', nameMl: 'സ്ത്രീ ശക്തി', type: 'WEEKLY' },
  'AKSHAYA': { code: 'AK', nameEn: 'Akshaya', nameMl: 'അക്ഷയ', type: 'WEEKLY' },
  'KARUNYA': { code: 'KR', nameEn: 'Karunya', nameMl: 'കാരുണ്യ', type: 'WEEKLY' },
  'NIRMAL': { code: 'NR', nameEn: 'Nirmal', nameMl: 'നിർമ്മൽ', type: 'WEEKLY' },
  'BHAGYAMITHRA': { code: 'BM', nameEn: 'Bhagyamithra', nameMl: 'ഭാഗ്യമിത്ര', type: 'WEEKLY' },
  'DHANALEKSHMI': { code: 'DL', nameEn: 'Dhanalekshmi', nameMl: 'ധനലക്ഷ്മി', type: 'WEEKLY' },
  'DHANALAKSHMI': { code: 'DL', nameEn: 'Dhanalakshmi', nameMl: 'ധനലക്ഷ്മി', type: 'WEEKLY' },
  // Bumpers
  'THIRUVONAM BUMPER': { code: 'BR', nameEn: 'Thiruvonam Bumper', nameMl: 'തിരുവോണം ബമ്പർ', type: 'BUMPER' },
  'MONSOON BUMPER': { code: 'BR', nameEn: 'Monsoon Bumper', nameMl: 'മൺസൂൺ ബമ്പർ', type: 'BUMPER' },
  'POOJA BUMPER': { code: 'BR', nameEn: 'Pooja Bumper', nameMl: 'പൂജ ബമ്പർ', type: 'BUMPER' },
  'CHRISTMAS NEW YEAR BUMPER': { code: 'BR', nameEn: 'Christmas New Year Bumper', nameMl: 'ക്രിസ്മസ് ന്യൂ ഈയർ ബമ്പർ', type: 'BUMPER' },
  'VISHU BUMPER': { code: 'BR', nameEn: 'Vishu Bumper', nameMl: 'വിഷു ബമ്പർ', type: 'BUMPER' },
  'SUMMER BUMPER': { code: 'BR', nameEn: 'Summer Bumper', nameMl: 'സമ്മർ ബമ്പർ', type: 'BUMPER' }
};

/**
 * Parses official Kerala State Lottery result text content.
 * Follows exact LOTIS gazette structure and extracts traceable categories.
 */
export function parseLotteryResultText(text: string, ocrUsed: boolean = false): ParseResult {
  const lines = text.split(/\r?\n/);
  const warnings: string[] = [];
  const errors: string[] = [];

  let lotteryNameEn = '';
  let lotteryNameMl = '';
  let lotteryCode = '';
  let drawNumber = '';
  let drawDate = '';
  let venue = 'Gorky Bhavan, Near Gandhari Amman Kovil, Thiruvananthapuram';
  const seriesSet = new Set<string>();

  const categories: ExtractedCategory[] = [];
  let currentCategory: ExtractedCategory | null = null;

  // Helpers to parse currency strings like "1,00,00,000/-" or "8,000/-"
  const parseAmount = (str: string): number => {
    const clean = str.replace(/[^0-9]/g, '');
    return clean ? parseInt(clean, 10) : 0;
  };

  const getOrdinalSuffix = (n: number): string => {
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return s[(v - 20) % 10] || s[v] || s[0];
  };

  // Header detection (scan up to 60 lines to accommodate extra PDF whitespace)
  for (let i = 0; i < Math.min(lines.length, 60); i++) {
    const line = lines[i].trim().toUpperCase();

    // 1. Detect Lottery Name from known dictionary
    if (!lotteryNameEn) {
      for (const [key, val] of Object.entries(LOTTERY_MAPPINGS)) {
        if (line.includes(key)) {
          lotteryNameEn = val.nameEn;
          lotteryNameMl = val.nameMl;
          lotteryCode = val.code;
          break;
        }
      }
    }

    // 1b. Dynamic Lottery Name extraction (e.g. "DHANALEKSHMI LOTTERY NO.DL-71st")
    if (!lotteryNameEn) {
      const dynamicMatch = line.match(/^([A-Z\s\-]+?)\s+(?:LOTTERY\s+NO|DRAW\s+NO)/i);
      if (dynamicMatch) {
        const raw = dynamicMatch[1].trim();
        if (!raw.includes('KERALA') && !raw.includes('STATE') && !raw.includes('GOVERNMENT') && raw.length > 2) {
          lotteryNameEn = raw.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
          lotteryNameMl = lotteryNameEn;
        }
      }
    }

    // 2. Detect Draw Number (e.g. "KN-642th DRAW", "DRAW NO. W-750", "NO. FF-110", "KN 642")
    if (!drawNumber) {
      const drawMatch = line.match(/(?:NO|LOTTERY NO|DRAW NO)[\.:\s]*([A-Z]{1,3}[-\s]\d+)/i) ||
                        line.match(/\b([A-Z]{1,3}-\d{2,5})\b/);
      if (drawMatch) {
        drawNumber = drawMatch[1].replace(/\s+/, '-').toUpperCase();
      }
    }

    // 3. Detect Draw Date (e.g. "held on 24/09/2026", "24-09-2026", "24/09/26")
    if (!drawDate) {
      const dateMatch = line.match(/(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})/);
      if (dateMatch) {
        const d = dateMatch[1].padStart(2, '0');
        const m = dateMatch[2].padStart(2, '0');
        const y = dateMatch[3].length === 2 ? `20${dateMatch[3]}` : dateMatch[3];
        drawDate = `${y}-${m}-${d}`;
      }
    }

    // 4. Detect Venue
    if (line.includes('AT GORKY BHAVAN') || line.includes('THIRUVANANTHAPURAM')) {
      const venueMatch = lines[i].match(/at\s+([^,]+(?:,[^,]+)*)/i);
      if (venueMatch) {
        venue = venueMatch[1].trim();
      }
    }
  }

  // Fallback defaults if header had minor variations
  if (!lotteryCode && drawNumber) {
    const prefix = drawNumber.split('-')[0];
    for (const val of Object.values(LOTTERY_MAPPINGS)) {
      if (val.code === prefix) {
        lotteryCode = val.code;
        lotteryNameEn = val.nameEn;
        lotteryNameMl = val.nameMl;
        break;
      }
    }
  }

  // Line-by-line prize category and winning entries parsing
  for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
    const rawLine = lines[lineIdx];
    const line = rawLine.trim();
    if (!line) continue;
    const upperLine = line.toUpperCase();

    // Check for Prize category header e.g.:
    // "1st Prize- Rs :1,00,00,000/-", "Cons Prize-Rs :5000/-", "4th Prize-Rs :5000/-", "9th Prize-Rs :100/-"
    const prizeHeaderMatch = upperLine.match(/(\d+(?:ST|ND|RD|TH)|CONSOLATION|CONS)\s+PRIZE[^\d]*RS[^\d]*([\d,]+)/i);

    if (prizeHeaderMatch) {
      if (currentCategory && currentCategory.entries.length > 0) {
        categories.push(currentCategory);
      }

      const rawOrdinal = prizeHeaderMatch[1];
      const ordinal = rawOrdinal === 'CONS' ? 'CONSOLATION' : rawOrdinal;
      const amount = parseAmount(prizeHeaderMatch[2]);
      const isConsolation = ordinal === 'CONSOLATION';

      const MALAYALAM_PRIZE_NAMES: Record<string, string> = {
        '1ST': 'ഒന്നാം സമ്മാനം',
        '2ND': 'രണ്ടാം സമ്മാനം',
        '3RD': 'മൂന്നാം സമ്മാനം',
        '4TH': 'നാലാം സമ്മാനം',
        '5TH': 'അഞ്ചാം സമ്മാനം',
        '6TH': 'ആറാം സമ്മാനം',
        '7TH': 'ഏഴാം സമ്മാനം',
        '8TH': 'എട്ടാം സമ്മാനം',
        '9TH': 'ഒൻപതാം സമ്മാനം',
        '10TH': 'പത്താം സമ്മാനം'
      };

      const ROMAN_CODES: Record<number, string> = {
        1: 'I',
        2: 'II',
        3: 'III',
        4: 'IV',
        5: 'V',
        6: 'VI',
        7: 'VII',
        8: 'VIII',
        9: 'IX',
        10: 'X'
      };

      let categoryCode = isConsolation ? 'CONSOLATION' : ordinal;
      let nameEn = isConsolation ? 'Consolation Prize' : `${ordinal} Prize`;
      let nameMl = isConsolation ? 'സമാശ്വാസ സമ്മാനം' : (MALAYALAM_PRIZE_NAMES[ordinal] || `${ordinal} സമ്മാനം`);
      let priority = 100;
      let matchType: MatchType = 'EXACT_FULL_TICKET';
      let matchDigits = 6;
      let seriesScope = 'ALL_SERIES';

      if (ordinal === '1ST') {
        categoryCode = 'I';
        nameEn = '1st Prize';
        nameMl = 'ഒന്നാം സമ്മാനം';
        priority = 1;
        matchType = 'EXACT_FULL_TICKET';
      } else if (isConsolation) {
        categoryCode = 'CONSOLATION';
        nameEn = 'Consolation Prize';
        nameMl = 'സമാശ്വാസ സമ്മാനം';
        priority = 2;
        matchType = 'CONSOLATION';
      } else if (ordinal === '2ND') {
        categoryCode = 'II';
        nameEn = '2nd Prize';
        nameMl = 'രണ്ടാം സമ്മാനം';
        priority = 3;
        matchType = 'EXACT_FULL_TICKET';
      } else if (ordinal === '3RD') {
        categoryCode = 'III';
        nameEn = '3rd Prize';
        nameMl = 'മൂന്നാം സമ്മാനം';
        priority = 4;
        matchType = 'EXACT_FULL_TICKET';
      } else {
        // Lower tiers (4th, 5th, 6th, 7th, 8th, 9th) are last 4 digits (or 5 for bumper)
        const numOrd = parseInt(ordinal, 10);
        categoryCode = `TIER_${numOrd}`;
        nameEn = `${numOrd}${getOrdinalSuffix(numOrd)} Prize`;
        nameMl = MALAYALAM_PRIZE_NAMES[`${numOrd}${getOrdinalSuffix(numOrd).toUpperCase()}`] || `${numOrd}-ാം സമ്മാനം`;
        priority = numOrd + 1; // 4th -> 5, 5th -> 6, 6th -> 7, 7th -> 8, 8th -> 9, 9th -> 10
        matchType = 'LAST_N_DIGITS';
        // Bumpers may use 5 digits, weeklies use 4
        matchDigits = (lotteryNameEn.includes('Bumper') && numOrd <= 5) ? 5 : 4;
      }

      currentCategory = {
        categoryCode,
        nameEn,
        nameMl,
        amount,
        matchType,
        matchDigits,
        seriesScope,
        priority,
        entries: []
      };

      // Check if ticket entries are on the SAME line as the header (e.g. "1st Prize- Rs :1,00,00,000/- MU 422635")
      const remainder = upperLine.substring(prizeHeaderMatch[0].length);
      parseTicketsInLine(remainder, currentCategory, lineIdx + 1, seriesSet, isConsolation);
      continue;
    }

    // If we are inside a category, parse tickets on this line
    if (currentCategory) {
      // If line contains disclaimer or ending tokens, don't parse as tickets
      if (upperLine.includes('THE PRIZE WINNERS ARE ADVISED') || 
          upperLine.includes('DIRECTORATE OF STATE LOTTERIES') ||
          upperLine.includes('JOINT DIRECTOR') ||
          upperLine.includes('NEXT DRAW')) {
        categories.push(currentCategory);
        currentCategory = null;
        continue;
      }

      const isConsolation = currentCategory.matchType === 'CONSOLATION';
      parseTicketsInLine(upperLine, currentCategory, lineIdx + 1, seriesSet, isConsolation);
    }
  }

  if (currentCategory && currentCategory.entries.length > 0) {
    categories.push(currentCategory);
  }

  // Calculate total entries
  const totalEntriesCount = categories.reduce((sum, c) => sum + c.entries.length, 0);

  // Confidence assessment
  let confidenceScore = 100;
  if (!lotteryNameEn) {
    confidenceScore -= 40;
    errors.push('Could not safely identify Lottery Name from official document.');
  }
  if (!drawNumber) {
    confidenceScore -= 30;
    errors.push('Could not safely identify Draw Number.');
  }
  if (!drawDate) {
    confidenceScore -= 30;
    errors.push('Could not safely identify Draw Date.');
  }
  if (categories.length === 0) {
    confidenceScore -= 40;
    errors.push('No prize categories extracted.');
  }
  if (ocrUsed) {
    confidenceScore = Math.min(confidenceScore, 70);
    warnings.push('Document text extracted via OCR. Mandatory manual verification required before publication.');
  }

  let confidence: 'HIGH' | 'MEDIUM' | 'LOW' = 'HIGH';
  if (confidenceScore < 60 || errors.length > 0) confidence = 'LOW';
  else if (confidenceScore < 90 || ocrUsed) confidence = 'MEDIUM';

  return {
    success: errors.length === 0 && categories.length > 0,
    lotteryNameEn: lotteryNameEn || 'Kerala State Lottery',
    lotteryNameMl: lotteryNameMl || 'കേരള സംസ്ഥാന ഭാഗ്യക്കുറി',
    lotteryCode: lotteryCode || 'KL',
    drawNumber: drawNumber || 'UNKNOWN',
    drawDate: drawDate || new Date().toISOString().split('T')[0],
    venue,
    seriesList: Array.from(seriesSet),
    categories,
    totalEntriesCount,
    confidence,
    confidenceScore,
    ocrUsed,
    warnings,
    errors,
    rawText: text
  };
}

function parseTicketsInLine(
  line: string,
  category: ExtractedCategory,
  lineNum: number,
  seriesSet: Set<string>,
  isConsolation: boolean
) {
  // Pattern 1: Series + 6 Digits e.g. "MU 422635" or concatenated in tables "PA 901174PB 901174"
  const seriesPattern = /([A-Z]{2})\s*(\d{6})/g;
  let match: RegExpExecArray | null;
  let foundSeriesMatch = false;

  while ((match = seriesPattern.exec(line)) !== null) {
    foundSeriesMatch = true;
    const series = match[1];
    const ticketNumber = match[2];
    seriesSet.add(series);

    category.entries.push({
      series,
      ticketNumber,
      fullTicket: `${series} ${ticketNumber}`,
      isConsolation,
      sourceLine: lineNum
    });
  }

  // If already matched series pattern, don't double count
  if (foundSeriesMatch) return;

  // Pattern 2: Suffix numbers (e.g. 4-digit numbers "0393 0584 0658" or concatenated PDF columns "00800556134614201489")
  if (category.matchType === 'LAST_N_DIGITS') {
    const N = category.matchDigits || 4;
    // Extract all contiguous digit sequences from the line
    const digitTokens = line.match(/\d+/g) || [];

    for (const token of digitTokens) {
      // If token length is an exact multiple of N (e.g. 4, 8, 12, 16, 20 digits)
      if (token.length >= N && token.length % N === 0) {
        for (let i = 0; i < token.length; i += N) {
          const suffix = token.slice(i, i + N);
          category.entries.push({
            ticketNumber: suffix,
            matchedSuffix: suffix,
            fullTicket: suffix,
            isConsolation: false,
            sourceLine: lineNum
          });
        }
      } else if (token.length === N) {
        category.entries.push({
          ticketNumber: token,
          matchedSuffix: token,
          fullTicket: token,
          isConsolation: false,
          sourceLine: lineNum
        });
      }
    }
  }
}
