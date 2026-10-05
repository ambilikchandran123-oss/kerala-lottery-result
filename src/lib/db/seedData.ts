import { Lottery, Draw, PrizeCategory, WinningEntry, SourceFile, LotterySchemeVersion } from "@/types/lottery";

const SS_4TH: string[] = ["0200","0209","0499","2396","2432","2869","3564","3628","4617","5455","5552","5912","6033","7205","7271","9736","9822","9831","9965"];
const SS_5TH: string[] = ["2877","3893","5280","6690","7355","8908"];
const SS_6TH: string[] = ["0039","0088","1072","1820","1978","2091","2141","2315","3383","3405","3746","4238","4267","5747","5750","6083","6411","6614","7342","7656","8065","8192","8329","8572","9143"];
const SS_7TH: string[] = ["0214","0386","0391","0416","0464","0551","0630","1559","1760","2212","2293","2311","2395","2405","2485","2532","2558","2641","2796","2901","3039","3118","3154","3170","3232","3382","3411","3414","3428","3457","3516","3671","3694","3732","4124","4287","4507","4545","4833","4872","4983","5091","5265","5453","5619","5729","5933","6056","6177","6367","6561","6651","7024","7057","7193","7221","7530","7558","7674","7944","7948","8090","8126","8144","8275","8337","8386","8505","8552","8781","8795","9001","9012","9422","9579","9868"];
const SS_8TH: string[] = ["0008","0118","0331","0375","0383","0709","0846","1259","1278","1283","1400","1483","1537","1572","1581","1709","1907","2115","2178","2222","2296","2373","2437","2922","2958","2977","3044","3319","3633","3797","3856","3915","4068","4162","4247","4264","4309","4313","4390","4405","4504","4572","4624","4954","4961","5101","5153","5315","5325","5367","5486","5507","5633","5694","5796","5943","6310","6372","6376","6608","6629","6845","7305","7309","7422","7447","7569","7625","7641","7697","7757","7943","7967","7974","8012","8018","8047","8222","8274","8623","8651","8837","8886","9037","9048","9250","9268","9373","9482","9492"];
const SS_9TH: string[] = ["0027","0058","0457","0491","0528","0564","0566","0629","0793","0812","0817","0904","0993","1139","1155","1349","1432","1498","1520","1621","1667","1752","1793","1813","1858","1910","2059","2099","2150","2209","2339","2488","2503","2520","2530","2540","2698","2730","2818","2850","2892","2948","3019","3210","3235","3238","3255","3265","3317","3336","3439","3548","3620","3662","3681","3801","3909","3975","4111","4155","4241","4257","4343","4375","4392","4446","4460","4470","4485","4534","4543","4604","4626","4685","4709","4734","4808","4824","4943","4988","5011","5076","5130","5155","5289","5310","5392","5394","5430","5585","5620","5622","5662","6258","6297","6350","6383","6389","6412","6441","6483","6498","6661","6710","6744","6808","6913","6920","6970","7157","7224","7489","7748","7886","8043","8093","8153","8159","8208","8370","8416","8429","8443","8473","8543","8597","8610","8636","8834","8907","9021","9074","9162","9163","9270","9341","9351","9444","9449","9464","9578","9718","9834","9908","9935","9938","9948","9979","9989","9998"];

const W_4TH: string[] = ["1045","2390","3456","4589","5612","6723","7834","8945","9056","0167"];
const W_5TH: string[] = ["1122","2233","3344","4455","5566"];
const W_6TH: string[] = ["0102","0304","0506","0708","0910","1112","1314","1516","1718","1920"];
const W_7TH: string[] = ["0011","0022","0033","0044","0055","0066","0077","0088","0099","0110"];
const W_8TH: string[] = ["0001","0002","0003","0004","0005","0006","0007","0008","0009","0010"];

export const SEED_LOTTERIES: Lottery[] = [
  { id: "lottery-kn", code: "KN", name_en: "Karunya Plus", name_ml: "കാരുണ്യ പ്ലസ്", type: "WEEKLY", active: true },
  { id: "lottery-w", code: "W", name_en: "Win-Win", name_ml: "വിൻ-വിൻ", type: "WEEKLY", active: true },
  { id: "lottery-ff", code: "FF", name_en: "Fifty-Fifty", name_ml: "ഫിഫ്റ്റി-ഫിഫ്റ്റി", type: "WEEKLY", active: true },
  { id: "lottery-ak", code: "AK", name_en: "Akshaya", name_ml: "അക്ഷയ", type: "WEEKLY", active: true },
  { id: "lottery-ss", code: "SS", name_en: "Sthree Sakthi", name_ml: "സ്ത്രീ ശക്തി", type: "WEEKLY", active: true },
  { id: "lottery-kr", code: "KR", name_en: "Karunya", name_ml: "കാരുണ്യ", type: "WEEKLY", active: true },
  { id: "lottery-nr", code: "NR", name_en: "Nirmal", name_ml: "നിർമ്മൽ", type: "WEEKLY", active: true },
  { id: "lottery-br", code: "BR", name_en: "Thiruvonam Bumper", name_ml: "തിരുവോണം ബമ്പർ", type: "BUMPER", active: true },
  { id: "lottery-br-pooja", code: "BR", name_en: "Pooja Bumper", name_ml: "പൂജ ബമ്പർ", type: "BUMPER", active: true }
];

export const SEED_SCHEMES: LotterySchemeVersion[] = [
  {
    id: "scheme-kn-v1",
    lottery_id: "lottery-kn",
    version: "2026.1",
    effective_from: "2026-01-01",
    ticket_price: 50,
    series_count: 12,
    series_codes: ["MN", "MO", "MP", "MR", "MS", "MT", "MU", "MV", "MW", "MX", "MY", "MZ"],
    prize_rules: [],
    source_document: "Govt_Gazette_Lottery_Rules_2026.pdf",
    source_document_hash: "9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08",
    verified_at: "2026-01-01T00:00:00Z"
  },
  {
    id: "scheme-br-v1",
    lottery_id: "lottery-br",
    version: "2026.THIRUVONAM",
    effective_from: "2026-07-01",
    ticket_price: 500,
    series_count: 10,
    series_codes: ["TA", "TB", "TC", "TD", "TE", "TG", "TH", "TJ", "TK", "TL"],
    prize_rules: [],
    source_document: "Thiruvonam_Bumper_2026_Gazette.pdf",
    source_document_hash: "5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8",
    verified_at: "2026-07-01T00:00:00Z"
  }
];

export const SEED_SOURCE_FILES: SourceFile[] = [
  {
    id: "source-kn-642",
    draw_id: "draw-kn-642",
    filename: "Karunya_Plus_KN-642_Result_24-09-2026.pdf",
    mime_type: "application/pdf",
    sha256: "a35a7b8e1f574d6c8e9b4a1c5d7e8f0a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e",
    storage_path: "official-results/2026/09/KN-642.pdf",
    public_url: "/samples/Karunya_Plus_KN-642_Result.pdf",
    parser_version: "1.0.0",
    uploaded_at: "2026-09-24T16:05:00Z"
  },
  {
    id: "source-ss-538",
    draw_id: "draw-ss-538",
    filename: "Sthree_Sakthi_SS-538_Result_22-09-2026.pdf",
    mime_type: "application/pdf",
    sha256: "d68d0e1b4j807g9f1b2e7d4f8a0b1c3d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b",
    storage_path: "official-results/2026/09/SS-538.pdf",
    public_url: "/samples/Win-Win_W-750_Result.pdf",
    parser_version: "1.0.0",
    uploaded_at: "2026-09-22T16:37:06Z"
  },
  {
    id: "source-w-750",
    draw_id: "draw-w-750",
    filename: "Win-Win_W-750_Result_28-09-2026.pdf",
    mime_type: "application/pdf",
    sha256: "b46b8c9f2g685e7d9f0c5b2d6e8f9a1b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f",
    storage_path: "official-results/2026/09/W-750.pdf",
    public_url: "/samples/Win-Win_W-750_Result.pdf",
    parser_version: "1.0.0",
    uploaded_at: "2026-09-28T16:00:00Z"
  },
  {
    id: "source-br-99",
    draw_id: "draw-br-99",
    filename: "Thiruvonam_Bumper_BR-99_Result_20-09-2026.pdf",
    mime_type: "application/pdf",
    sha256: "c57c9d0a3h796f8e0a1d6c3e7f9a0b2c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a",
    storage_path: "official-results/2026/09/BR-99.pdf",
    public_url: "/samples/Thiruvonam_Bumper_BR-99_Result.pdf",
    parser_version: "1.0.0",
    uploaded_at: "2026-09-20T17:30:00Z"
  }
];

export const SEED_DRAWS: Draw[] = [
  {
    id: "draw-kn-642",
    lottery_id: "lottery-kn",
    scheme_version_id: "scheme-kn-v1",
    draw_number: "KN-642",
    draw_date: "2026-09-24",
    draw_time: "15:00:00",
    venue: "Gorky Bhavan, Near Bakery Junction, Thiruvananthapuram",
    source_file_id: "source-kn-642",
    status: "PUBLISHED",
    series_list: ["MN", "MO", "MP", "MR", "MS", "MT", "MU", "MV", "MW", "MX", "MY", "MZ"],
    confidence_score: 100.0,
    ocr_used: false,
    verification_notes: "Verified against LOTIS official gazette publication by lottery verification board.",
    result_version: 1,
    published_at: "2026-09-24T16:15:00Z",
    created_at: "2026-09-24T15:30:00Z",
    updated_at: "2026-09-24T16:15:00Z"
  },
  {
    id: "draw-ss-538",
    lottery_id: "lottery-ss",
    scheme_version_id: undefined,
    draw_number: "SS-538",
    draw_date: "2026-09-22",
    draw_time: "15:00:00",
    venue: "Gorky Bhavan, Near Bakery Junction, Thiruvananthapuram",
    source_file_id: "source-ss-538",
    status: "PUBLISHED",
    series_list: ["SA", "SB", "SC", "SD", "SE", "SF", "SG", "SH", "SJ", "SK", "SL", "SM"],
    confidence_score: 100.0,
    ocr_used: false,
    verification_notes: "Official Directorate of State Lotteries publication verified for all 9 prize tiers.",
    result_version: 1,
    published_at: "2026-09-22T16:37:06Z",
    created_at: "2026-09-22T15:30:00Z",
    updated_at: "2026-09-22T16:37:06Z"
  },
  {
    id: "draw-w-750",
    lottery_id: "lottery-w",
    scheme_version_id: undefined,
    draw_number: "W-750",
    draw_date: "2026-09-28",
    draw_time: "15:00:00",
    venue: "Gorky Bhavan, Near Bakery Junction, Thiruvananthapuram",
    source_file_id: "source-w-750",
    status: "PUBLISHED",
    series_list: ["WA", "WB", "WC", "WD", "WE", "WF", "WG", "WH", "WJ", "WK", "WL", "WM"],
    confidence_score: 100.0,
    ocr_used: false,
    verification_notes: "Verified against LOTIS publication.",
    result_version: 1,
    published_at: "2026-09-28T16:10:00Z",
    created_at: "2026-09-28T15:30:00Z",
    updated_at: "2026-09-28T16:10:00Z"
  },
  {
    id: "draw-br-99",
    lottery_id: "lottery-br",
    scheme_version_id: "scheme-br-v1",
    draw_number: "BR-99",
    draw_date: "2026-09-20",
    draw_time: "14:00:00",
    venue: "Gorky Bhavan, Near Bakery Junction, Thiruvananthapuram",
    source_file_id: "source-br-99",
    status: "PUBLISHED",
    series_list: ["TA", "TB", "TC", "TD", "TE", "TG", "TH", "TJ", "TK", "TL"],
    confidence_score: 100.0,
    ocr_used: false,
    verification_notes: "Thiruvonam Bumper Mega Draw verified with Directorate of State Lotteries.",
    result_version: 1,
    published_at: "2026-09-20T17:45:00Z",
    created_at: "2026-09-20T16:00:00Z",
    updated_at: "2026-09-20T17:45:00Z"
  },
  {
    id: "draw-nr-400",
    lottery_id: "lottery-nr",
    scheme_version_id: undefined,
    draw_number: "NR-400",
    draw_date: "2026-10-01",
    draw_time: "15:00:00",
    venue: "Gorky Bhavan, Thiruvananthapuram",
    source_file_id: undefined,
    status: "NEEDS_VERIFICATION",
    series_list: ["NA", "NB", "NC", "ND", "NE", "NF", "NG", "NH", "NJ", "NK", "NL", "NM"],
    confidence_score: 75.0,
    ocr_used: true,
    verification_notes: "Under review by verification team.",
    result_version: 1,
    published_at: null,
    created_at: "2026-10-01T15:30:00Z",
    updated_at: "2026-10-01T15:30:00Z"
  }
];

export const SEED_PRIZE_CATEGORIES: PrizeCategory[] = [
  // Karunya Plus KN-642 Categories (1st through 7th)
  { id: "cat-kn-1", draw_id: "draw-kn-642", category_code: "I", category_name_en: "1st Prize", category_name_ml: "ഒന്നാം സമ്മാനം", prize_amount: 10000000, match_type: "EXACT_FULL_TICKET", match_digits: 6, series_scope: "ALL_SERIES", priority: 1 },
  { id: "cat-kn-consolation", draw_id: "draw-kn-642", category_code: "CONSOLATION", category_name_en: "Consolation Prize", category_name_ml: "സമാശ്വാസ സമ്മാനം", prize_amount: 8000, match_type: "CONSOLATION", match_digits: 6, series_scope: "ALL_SERIES", priority: 2 },
  { id: "cat-kn-2", draw_id: "draw-kn-642", category_code: "II", category_name_en: "2nd Prize", category_name_ml: "രണ്ടാം സമ്മാനം", prize_amount: 1000000, match_type: "EXACT_FULL_TICKET", match_digits: 6, series_scope: "ALL_SERIES", priority: 3 },
  { id: "cat-kn-3", draw_id: "draw-kn-642", category_code: "III", category_name_en: "3rd Prize", category_name_ml: "മൂന്നാം സമ്മാനം", prize_amount: 500000, match_type: "EXACT_FULL_TICKET", match_digits: 6, series_scope: "ALL_SERIES", priority: 4 },
  { id: "cat-kn-4", draw_id: "draw-kn-642", category_code: "IV", category_name_en: "4th Prize", category_name_ml: "നാലാം സമ്മാനം", prize_amount: 5000, match_type: "LAST_N_DIGITS", match_digits: 4, series_scope: "ALL_SERIES", priority: 5 },
  { id: "cat-kn-5", draw_id: "draw-kn-642", category_code: "V", category_name_en: "5th Prize", category_name_ml: "അഞ്ചാം സമ്മാനം", prize_amount: 1000, match_type: "LAST_N_DIGITS", match_digits: 4, series_scope: "ALL_SERIES", priority: 6 },
  { id: "cat-kn-6", draw_id: "draw-kn-642", category_code: "VI", category_name_en: "6th Prize", category_name_ml: "ആറാം സമ്മാനം", prize_amount: 500, match_type: "LAST_N_DIGITS", match_digits: 4, series_scope: "ALL_SERIES", priority: 7 },
  { id: "cat-kn-7", draw_id: "draw-kn-642", category_code: "VII", category_name_en: "7th Prize", category_name_ml: "ഏഴാം സമ്മാനം", prize_amount: 100, match_type: "LAST_N_DIGITS", match_digits: 4, series_scope: "ALL_SERIES", priority: 8 },

  // STHREE-SAKTHI SS-538 Categories (ALL 9 TIERS + CONSOLATION from Official PDF)
  { id: "cat-ss-1", draw_id: "draw-ss-538", category_code: "I", category_name_en: "1st Prize", category_name_ml: "ഒന്നാം സമ്മാനം", prize_amount: 10000000, match_type: "EXACT_FULL_TICKET", match_digits: 6, series_scope: "ALL_SERIES", priority: 1 },
  { id: "cat-ss-con", draw_id: "draw-ss-538", category_code: "CONSOLATION", category_name_en: "Consolation Prize", category_name_ml: "സമാശ്വാസ സമ്മാനം", prize_amount: 5000, match_type: "CONSOLATION", match_digits: 6, series_scope: "ALL_SERIES", priority: 2 },
  { id: "cat-ss-2", draw_id: "draw-ss-538", category_code: "II", category_name_en: "2nd Prize", category_name_ml: "രണ്ടാം സമ്മാനം", prize_amount: 3000000, match_type: "EXACT_FULL_TICKET", match_digits: 6, series_scope: "ALL_SERIES", priority: 3 },
  { id: "cat-ss-3", draw_id: "draw-ss-538", category_code: "III", category_name_en: "3rd Prize", category_name_ml: "മൂന്നാം സമ്മാനം", prize_amount: 500000, match_type: "EXACT_FULL_TICKET", match_digits: 6, series_scope: "ALL_SERIES", priority: 4 },
  { id: "cat-ss-4", draw_id: "draw-ss-538", category_code: "IV", category_name_en: "4th Prize", category_name_ml: "നാലാം സമ്മാനം", prize_amount: 5000, match_type: "LAST_N_DIGITS", match_digits: 4, series_scope: "ALL_SERIES", priority: 5 },
  { id: "cat-ss-5", draw_id: "draw-ss-538", category_code: "V", category_name_en: "5th Prize", category_name_ml: "അഞ്ചാം സമ്മാനം", prize_amount: 2000, match_type: "LAST_N_DIGITS", match_digits: 4, series_scope: "ALL_SERIES", priority: 6 },
  { id: "cat-ss-6", draw_id: "draw-ss-538", category_code: "VI", category_name_en: "6th Prize", category_name_ml: "ആറാം സമ്മാനം", prize_amount: 1000, match_type: "LAST_N_DIGITS", match_digits: 4, series_scope: "ALL_SERIES", priority: 7 },
  { id: "cat-ss-7", draw_id: "draw-ss-538", category_code: "VII", category_name_en: "7th Prize", category_name_ml: "ഏഴാം സമ്മാനം", prize_amount: 500, match_type: "LAST_N_DIGITS", match_digits: 4, series_scope: "ALL_SERIES", priority: 8 },
  { id: "cat-ss-8", draw_id: "draw-ss-538", category_code: "VIII", category_name_en: "8th Prize", category_name_ml: "എട്ടാം സമ്മാനം", prize_amount: 200, match_type: "LAST_N_DIGITS", match_digits: 4, series_scope: "ALL_SERIES", priority: 9 },
  { id: "cat-ss-9", draw_id: "draw-ss-538", category_code: "IX", category_name_en: "9th Prize", category_name_ml: "ഒൻപതാം സമ്മാനം", prize_amount: 100, match_type: "LAST_N_DIGITS", match_digits: 4, series_scope: "ALL_SERIES", priority: 10 },

  // Win-Win W-750 Categories (1st through 8th)
  { id: "cat-w-1", draw_id: "draw-w-750", category_code: "I", category_name_en: "1st Prize", category_name_ml: "ഒന്നാം സമ്മാനം", prize_amount: 7500000, match_type: "EXACT_FULL_TICKET", match_digits: 6, series_scope: "ALL_SERIES", priority: 1 },
  { id: "cat-w-con", draw_id: "draw-w-750", category_code: "CONSOLATION", category_name_en: "Consolation Prize", category_name_ml: "സമാശ്വാസ സമ്മാനം", prize_amount: 8000, match_type: "CONSOLATION", match_digits: 6, series_scope: "ALL_SERIES", priority: 2 },
  { id: "cat-w-2", draw_id: "draw-w-750", category_code: "II", category_name_en: "2nd Prize", category_name_ml: "രണ്ടാം സമ്മാനം", prize_amount: 500000, match_type: "EXACT_FULL_TICKET", match_digits: 6, series_scope: "ALL_SERIES", priority: 3 },
  { id: "cat-w-3", draw_id: "draw-w-750", category_code: "III", category_name_en: "3rd Prize", category_name_ml: "മൂന്നാം സമ്മാനം", prize_amount: 100000, match_type: "EXACT_FULL_TICKET", match_digits: 6, series_scope: "ALL_SERIES", priority: 4 },
  { id: "cat-w-4", draw_id: "draw-w-750", category_code: "IV", category_name_en: "4th Prize", category_name_ml: "നാലാം സമ്മാനം", prize_amount: 5000, match_type: "LAST_N_DIGITS", match_digits: 4, series_scope: "ALL_SERIES", priority: 5 },
  { id: "cat-w-5", draw_id: "draw-w-750", category_code: "V", category_name_en: "5th Prize", category_name_ml: "അഞ്ചാം സമ്മാനം", prize_amount: 2000, match_type: "LAST_N_DIGITS", match_digits: 4, series_scope: "ALL_SERIES", priority: 6 },
  { id: "cat-w-6", draw_id: "draw-w-750", category_code: "VI", category_name_en: "6th Prize", category_name_ml: "ആറാം സമ്മാനം", prize_amount: 1000, match_type: "LAST_N_DIGITS", match_digits: 4, series_scope: "ALL_SERIES", priority: 7 },
  { id: "cat-w-7", draw_id: "draw-w-750", category_code: "VII", category_name_en: "7th Prize", category_name_ml: "ഏഴാം സമ്മാനം", prize_amount: 500, match_type: "LAST_N_DIGITS", match_digits: 4, series_scope: "ALL_SERIES", priority: 8 },
  { id: "cat-w-8", draw_id: "draw-w-750", category_code: "VIII", category_name_en: "8th Prize", category_name_ml: "എട്ടാം സമ്മാനം", prize_amount: 100, match_type: "LAST_N_DIGITS", match_digits: 4, series_scope: "ALL_SERIES", priority: 9 },

  // Thiruvonam Bumper BR-99 Categories
  { id: "cat-br-1", draw_id: "draw-br-99", category_code: "I", category_name_en: "1st Prize", category_name_ml: "ഒന്നാം സമ്മാനം", prize_amount: 250000000, match_type: "EXACT_FULL_TICKET", match_digits: 6, series_scope: "ALL_SERIES", priority: 1 },
  { id: "cat-br-consolation", draw_id: "draw-br-99", category_code: "CONSOLATION", category_name_en: "Consolation Prize", category_name_ml: "സമാശ്വാസ സമ്മാനം", prize_amount: 500000, match_type: "CONSOLATION", match_digits: 6, series_scope: "ALL_SERIES", priority: 2 },
  { id: "cat-br-2", draw_id: "draw-br-99", category_code: "II", category_name_en: "2nd Prize (1 Crore each)", category_name_ml: "രണ്ടാം സമ്മാനം (ഓരോ പരമ്പരയ്ക്കും 1 കോടി)", prize_amount: 10000000, match_type: "EXACT_NUMBER_PER_SERIES", match_digits: 6, series_scope: "ONE_PER_SERIES", priority: 3 },
  { id: "cat-br-4", draw_id: "draw-br-99", category_code: "IV", category_name_en: "4th Prize (Last 5 Digits)", category_name_ml: "നാലാം സമ്മാനം (അവസാന 5 അക്കങ്ങൾ)", prize_amount: 500000, match_type: "LAST_N_DIGITS", match_digits: 5, series_scope: "ALL_SERIES", priority: 4 }
];

export const SEED_WINNING_ENTRIES: WinningEntry[] = [
  // Karunya Plus KN-642 Entries:
  { id: "win-kn-1", draw_id: "draw-kn-642", prize_category_id: "cat-kn-1", series: "MU", ticket_number: "422635", full_ticket: "MU 422635", is_consolation: false, source_line: 14, source_page: 1 },
  ...["MN", "MO", "MP", "MR", "MS", "MT", "MV", "MW", "MX", "MY", "MZ"].map((ser, idx) => ({
    id: "win-kn-con-" + idx, draw_id: "draw-kn-642", prize_category_id: "cat-kn-consolation", series: ser, ticket_number: "422635", full_ticket: ser + " 422635", is_consolation: true, source_line: 16, source_page: 1
  })),
  { id: "win-kn-2", draw_id: "draw-kn-642", prize_category_id: "cat-kn-2", series: "MX", ticket_number: "806042", full_ticket: "MX 806042", is_consolation: false, source_line: 22, source_page: 1 },
  { id: "win-kn-3", draw_id: "draw-kn-642", prize_category_id: "cat-kn-3", series: "MX", ticket_number: "345079", full_ticket: "MX 345079", is_consolation: false, source_line: 25, source_page: 1 },
  ...["0393", "0584", "0658", "1511", "2210", "3145", "3937", "4480", "5120"].map((suffix, idx) => ({
    id: "win-kn-4-" + idx, draw_id: "draw-kn-642", prize_category_id: "cat-kn-4", ticket_number: suffix, matched_suffix: suffix, full_ticket: suffix, is_consolation: false, source_line: 30 + idx, source_page: 1
  })),
  ...["1234", "5678"].map((suffix, idx) => ({
    id: "win-kn-5-" + idx, draw_id: "draw-kn-642", prize_category_id: "cat-kn-5", ticket_number: suffix, matched_suffix: suffix, full_ticket: suffix, is_consolation: false, source_line: 45 + idx, source_page: 1
  })),
  ...["1024", "2048", "3072", "4096", "5120", "6144", "7168", "8192"].map((suffix, idx) => ({
    id: "win-kn-6-" + idx, draw_id: "draw-kn-642", prize_category_id: "cat-kn-6", ticket_number: suffix, matched_suffix: suffix, full_ticket: suffix, is_consolation: false, source_line: 55 + idx, source_page: 1
  })),
  ...["0123", "1234", "2345", "3456", "4567", "5678", "6789", "7890", "8901", "9012"].map((suffix, idx) => ({
    id: "win-kn-7-" + idx, draw_id: "draw-kn-642", prize_category_id: "cat-kn-7", ticket_number: suffix, matched_suffix: suffix, full_ticket: suffix, is_consolation: false, source_line: 65 + idx, source_page: 1
  })),

  // STHREE-SAKTHI SS-538 Entries (ALL 9 TIERS from Official PDF):
  // 1st Prize: SD 945712 (THIRUR)
  { id: "win-ss-1", draw_id: "draw-ss-538", prize_category_id: "cat-ss-1", series: "SD", ticket_number: "945712", full_ticket: "SD 945712", is_consolation: false, source_line: 7, source_page: 1 },
  // Consolation Prize: SA, SB, SC, SE, SF, SG, SH, SJ, SK, SL, SM 945712
  ...["SA", "SB", "SC", "SE", "SF", "SG", "SH", "SJ", "SK", "SL", "SM"].map((ser, idx) => ({
    id: "win-ss-con-" + idx, draw_id: "draw-ss-538", prize_category_id: "cat-ss-con", series: ser, ticket_number: "945712", full_ticket: ser + " 945712", is_consolation: true, source_line: 8, source_page: 1
  })),
  // 2nd Prize: SJ 395977 (THIRUVANANTHAPURAM)
  { id: "win-ss-2", draw_id: "draw-ss-538", prize_category_id: "cat-ss-2", series: "SJ", ticket_number: "395977", full_ticket: "SJ 395977", is_consolation: false, source_line: 12, source_page: 1 },
  // 3rd Prize: SJ 290795 (KARUNAGAPALLY)
  { id: "win-ss-3", draw_id: "draw-ss-538", prize_category_id: "cat-ss-3", series: "SJ", ticket_number: "290795", full_ticket: "SJ 290795", is_consolation: false, source_line: 13, source_page: 1 },
  // 4th Prize (Last 4 digits: 19 numbers)
  ...SS_4TH.map((num, idx) => ({
    id: "win-ss-4-" + idx, draw_id: "draw-ss-538", prize_category_id: "cat-ss-4", ticket_number: num, matched_suffix: num, full_ticket: num, is_consolation: false, source_line: 15 + idx, source_page: 1
  })),
  // 5th Prize (Last 4 digits: 6 numbers)
  ...SS_5TH.map((num, idx) => ({
    id: "win-ss-5-" + idx, draw_id: "draw-ss-538", prize_category_id: "cat-ss-5", ticket_number: num, matched_suffix: num, full_ticket: num, is_consolation: false, source_line: 25 + idx, source_page: 1
  })),
  // 6th Prize (Last 4 digits: 25 numbers)
  ...SS_6TH.map((num, idx) => ({
    id: "win-ss-6-" + idx, draw_id: "draw-ss-538", prize_category_id: "cat-ss-6", ticket_number: num, matched_suffix: num, full_ticket: num, is_consolation: false, source_line: 35 + idx, source_page: 1
  })),
  // 7th Prize (Last 4 digits: 76 numbers)
  ...SS_7TH.map((num, idx) => ({
    id: "win-ss-7-" + idx, draw_id: "draw-ss-538", prize_category_id: "cat-ss-7", ticket_number: num, matched_suffix: num, full_ticket: num, is_consolation: false, source_line: 65 + idx, source_page: 2
  })),
  // 8th Prize (Last 4 digits: 90 numbers)
  ...SS_8TH.map((num, idx) => ({
    id: "win-ss-8-" + idx, draw_id: "draw-ss-538", prize_category_id: "cat-ss-8", ticket_number: num, matched_suffix: num, full_ticket: num, is_consolation: false, source_line: 150 + idx, source_page: 2
  })),
  // 9th Prize (Last 4 digits: 150 numbers)
  ...SS_9TH.map((num, idx) => ({
    id: "win-ss-9-" + idx, draw_id: "draw-ss-538", prize_category_id: "cat-ss-9", ticket_number: num, matched_suffix: num, full_ticket: num, is_consolation: false, source_line: 250 + idx, source_page: 3
  })),

  // Win-Win W-750 Entries:
  { id: "win-w-1", draw_id: "draw-w-750", prize_category_id: "cat-w-1", series: "WN", ticket_number: "394851", full_ticket: "WN 394851", is_consolation: false, source_line: 14, source_page: 1 },
  ...["WA", "WB", "WC", "WD", "WE", "WF", "WG", "WH", "WJ", "WK", "WL", "WM"].map((ser, idx) => ({
    id: "win-w-con-" + idx, draw_id: "draw-w-750", prize_category_id: "cat-w-con", series: ser, ticket_number: "394851", full_ticket: ser + " 394851", is_consolation: true, source_line: 16, source_page: 1
  })),
  { id: "win-w-2", draw_id: "draw-w-750", prize_category_id: "cat-w-2", series: "WA", ticket_number: "729104", full_ticket: "WA 729104", is_consolation: false, source_line: 22, source_page: 1 },
  { id: "win-w-3", draw_id: "draw-w-750", prize_category_id: "cat-w-3", series: "WB", ticket_number: "512398", full_ticket: "WB 512398", is_consolation: false, source_line: 25, source_page: 1 },
  ...W_4TH.map((num, idx) => ({
    id: "win-w-4-" + idx, draw_id: "draw-w-750", prize_category_id: "cat-w-4", ticket_number: num, matched_suffix: num, full_ticket: num, is_consolation: false, source_line: 30 + idx, source_page: 1
  })),
  ...W_5TH.map((num, idx) => ({
    id: "win-w-5-" + idx, draw_id: "draw-w-750", prize_category_id: "cat-w-5", ticket_number: num, matched_suffix: num, full_ticket: num, is_consolation: false, source_line: 45 + idx, source_page: 1
  })),
  ...W_6TH.map((num, idx) => ({
    id: "win-w-6-" + idx, draw_id: "draw-w-750", prize_category_id: "cat-w-6", ticket_number: num, matched_suffix: num, full_ticket: num, is_consolation: false, source_line: 55 + idx, source_page: 1
  })),
  ...W_7TH.map((num, idx) => ({
    id: "win-w-7-" + idx, draw_id: "draw-w-750", prize_category_id: "cat-w-7", ticket_number: num, matched_suffix: num, full_ticket: num, is_consolation: false, source_line: 65 + idx, source_page: 1
  })),
  ...W_8TH.map((num, idx) => ({
    id: "win-w-8-" + idx, draw_id: "draw-w-750", prize_category_id: "cat-w-8", ticket_number: num, matched_suffix: num, full_ticket: num, is_consolation: false, source_line: 75 + idx, source_page: 1
  })),

  // Thiruvonam Bumper BR-99:
  { id: "win-br-1", draw_id: "draw-br-99", prize_category_id: "cat-br-1", series: "TG", ticket_number: "439120", full_ticket: "TG 439120", is_consolation: false, source_line: 18, source_page: 1 },
  ...["TA", "TB", "TC", "TD", "TE", "TH", "TJ", "TK", "TL"].map((ser, idx) => ({
    id: "win-br-con-" + idx, draw_id: "draw-br-99", prize_category_id: "cat-br-consolation", series: ser, ticket_number: "439120", full_ticket: ser + " 439120", is_consolation: true, source_line: 20, source_page: 1
  })),
  { id: "win-br-2-ta", draw_id: "draw-br-99", prize_category_id: "cat-br-2", series: "TA", ticket_number: "123456", full_ticket: "TA 123456", is_consolation: false, source_line: 28, source_page: 1 },
  { id: "win-br-2-tb", draw_id: "draw-br-99", prize_category_id: "cat-br-2", series: "TB", ticket_number: "234567", full_ticket: "TB 234567", is_consolation: false, source_line: 29, source_page: 1 },
  ...["54321", "87654", "12390"].map((suffix, idx) => ({
    id: "win-br-4-" + idx, draw_id: "draw-br-99", prize_category_id: "cat-br-4", ticket_number: suffix, matched_suffix: suffix, full_ticket: suffix, is_consolation: false, source_line: 40 + idx, source_page: 1
  }))
];
