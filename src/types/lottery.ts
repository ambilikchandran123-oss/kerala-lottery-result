export type LotteryType = 'WEEKLY' | 'BUMPER';

export type DrawStatus = 
  | 'DRAFT' 
  | 'PROCESSING' 
  | 'NEEDS_VERIFICATION' 
  | 'VERIFIED' 
  | 'PUBLISHED' 
  | 'ARCHIVED' 
  | 'REJECTED';

export type MatchType = 
  | 'EXACT_FULL_TICKET' 
  | 'EXACT_NUMBER_PER_SERIES' 
  | 'CONSOLATION' 
  | 'LAST_N_DIGITS' 
  | 'OTHER_RULE';

export interface Lottery {
  id: string;
  code: string;
  name_en: string;
  name_ml: string;
  type: LotteryType;
  active: boolean;
  created_at?: string;
}

export interface SchemeRule {
  category_code: string;
  category_name_en: string;
  category_name_ml: string;
  prize_amount: number;
  match_type: MatchType;
  match_digits: number;
  series_scope: 'ALL_SERIES' | 'ONE_PER_SERIES' | 'SPECIFIC_SERIES';
  priority: number;
}

export interface LotterySchemeVersion {
  id: string;
  lottery_id: string;
  version: string;
  effective_from: string;
  effective_to?: string | null;
  ticket_price: number;
  series_count: number;
  series_codes: string[];
  prize_rules: SchemeRule[];
  source_document?: string;
  source_document_hash?: string;
  verified_at?: string;
}

export interface SourceFile {
  id: string;
  draw_id?: string;
  filename: string;
  mime_type: string;
  sha256: string;
  storage_path: string;
  public_url?: string;
  raw_text?: string;
  parser_version: string;
  uploaded_at: string;
}

export interface Draw {
  id: string;
  lottery_id: string;
  scheme_version_id?: string;
  draw_number: string;
  draw_date: string; // YYYY-MM-DD
  draw_time?: string;
  venue?: string;
  source_file_id?: string;
  status: DrawStatus;
  series_list: string[];
  confidence_score: number;
  ocr_used: boolean;
  verification_notes?: string;
  result_version: number;
  published_at?: string | null;
  created_at?: string;
  updated_at?: string;
  // Joined fields for display
  lottery?: Lottery;
  source_file?: SourceFile;
  prize_categories?: PrizeCategory[];
  winning_entries_count?: number;
}

export interface PrizeCategory {
  id: string;
  draw_id: string;
  category_code: string;
  category_name_en: string;
  category_name_ml: string;
  prize_amount: number;
  match_type: MatchType;
  match_digits: number;
  series_scope: string;
  priority: number;
}

export interface WinningEntry {
  id: string;
  draw_id: string;
  prize_category_id: string;
  series?: string | null;
  ticket_number: string;
  full_ticket?: string | null;
  matched_suffix?: string | null;
  is_consolation: boolean;
  source_line?: number | null;
  source_page?: number;
  // Joined relation
  prize_category?: PrizeCategory;
}

export interface ResultAuditLog {
  id: string;
  draw_id: string;
  action: 'IMPORT' | 'VERIFY' | 'PUBLISH' | 'CORRECT' | 'ARCHIVE' | 'REJECT';
  old_version?: number;
  new_version?: number;
  reason?: string;
  performed_by: string;
  timestamp: string;
}

export interface NormalizedTicket {
  raw_input: string;
  normalized_series: string;
  normalized_number: string;
  normalized_full_ticket: string;
  valid: boolean;
  error?: string;
}

export interface BarcodeDecodeResult {
  rawPayload: string;
  series: string | null;
  ticketNumber: string | null;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW' | 'UNIDENTIFIED';
  format: string;
  errorMessage?: string;
}

export interface WinningPrizeInfo {
  category: string;
  categoryCode: string;
  name: string;
  nameMl: string;
  amount: number;
  formattedAmount: string;
}

export interface NearestMissInfo {
  winningTicket: string;
  winningSeries?: string;
  winningNumber: string;
  userTicket: string;
  prizeCategoryCode: string;
  prizeName: string;
  prizeNameMl: string;
  prizeAmount: number;
  formattedAmount: string;
  isJustMissed: boolean;
  differenceType: 'OFF_BY_ONE_NUM' | 'ONE_DIGIT_DIFF' | 'SERIES_DIFF' | 'CLOSE_RANGE' | 'NEAREST_WINNER';
  differenceDescEn: string;
  differenceDescMl: string;
  digitDifferenceCount?: number;
  numericDiff?: number;
}

export interface CheckTicketResult {
  status: 'WIN' | 'NO_WINNING_RESULT_FOUND' | 'DRAW_NOT_PUBLISHED' | 'ERROR';
  verified: boolean;
  lottery?: {
    name: string;
    nameMl: string;
    code: string;
    type: LotteryType;
  };
  draw?: {
    id: string;
    number: string;
    date: string; // YYYY-MM-DD
    formattedDate: string; // DD Month YYYY
    venue?: string;
    ticketPrice?: number;
  };
  ticket?: {
    series: string;
    number: string;
    fullTicket: string;
  };
  prize?: WinningPrizeInfo;
  nearestMiss?: NearestMissInfo;
  match?: {
    type: MatchType;
    details?: string;
    matchedSuffix?: string;
  };
  source?: {
    filename: string;
    sha256: string;
    pdfUrl?: string;
    verified: boolean;
    sourceLine?: number;
    sourcePage?: number;
  };
  message?: string;
}
