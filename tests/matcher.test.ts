import { describe, it } from 'node:test';
import assert from 'node:assert';
import { checkTicket } from '../src/lib/engine/matcher';
import { Draw, PrizeCategory, WinningEntry } from '../src/types/lottery';

describe('Kerala Lottery High-Accuracy Matching Engine', () => {
  // Test Draw Fixture (Karunya Plus KN-642)
  const publishedWeeklyDraw: Draw = {
    id: 'draw-test-kn-642',
    lottery_id: 'lottery-kn',
    draw_number: 'KN-642',
    draw_date: '2026-09-24',
    venue: 'Gorky Bhavan, Thiruvananthapuram',
    status: 'PUBLISHED',
    series_list: ['MN', 'MO', 'MP', 'MR', 'MS', 'MT', 'MU', 'MV', 'MW', 'MX', 'MY', 'MZ'],
    confidence_score: 100,
    ocr_used: false,
    result_version: 1,
    published_at: '2026-09-24T16:00:00Z',
    source_file: {
      id: 'sf-1',
      filename: 'KN-642.pdf',
      mime_type: 'application/pdf',
      sha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      storage_path: 'results/kn642.pdf',
      parser_version: '1.0.0',
      uploaded_at: '2026-09-24T15:30:00Z'
    }
  };

  const prizeCategories: PrizeCategory[] = [
    {
      id: 'cat-1',
      draw_id: 'draw-test-kn-642',
      category_code: 'I',
      category_name_en: 'First Prize',
      category_name_ml: 'ഒന്നാം സമ്മാനം',
      prize_amount: 10000000,
      match_type: 'EXACT_FULL_TICKET',
      match_digits: 6,
      series_scope: 'ALL_SERIES',
      priority: 1
    },
    {
      id: 'cat-con',
      draw_id: 'draw-test-kn-642',
      category_code: 'CONSOLATION',
      category_name_en: 'Consolation Prize',
      category_name_ml: 'സമാശ്വാസ സമ്മാനം',
      prize_amount: 8000,
      match_type: 'CONSOLATION',
      match_digits: 6,
      series_scope: 'ALL_SERIES',
      priority: 2
    },
    {
      id: 'cat-2',
      draw_id: 'draw-test-kn-642',
      category_code: 'II',
      category_name_en: 'Second Prize',
      category_name_ml: 'രണ്ടാം സമ്മാനം',
      prize_amount: 1000000,
      match_type: 'EXACT_FULL_TICKET',
      match_digits: 6,
      series_scope: 'ALL_SERIES',
      priority: 3
    },
    {
      id: 'cat-4',
      draw_id: 'draw-test-kn-642',
      category_code: 'IV',
      category_name_en: 'Fourth Prize',
      category_name_ml: 'നാലാം സമ്മാനം',
      prize_amount: 5000,
      match_type: 'LAST_N_DIGITS',
      match_digits: 4,
      series_scope: 'ALL_SERIES',
      priority: 4
    }
  ];

  const winningEntries: WinningEntry[] = [
    // 1st Prize: MU 422635
    {
      id: 'win-1',
      draw_id: 'draw-test-kn-642',
      prize_category_id: 'cat-1',
      series: 'MU',
      ticket_number: '422635',
      full_ticket: 'MU 422635',
      is_consolation: false,
      source_line: 14
    },
    // Consolation for remaining series
    ...['MN', 'MO', 'MP', 'MR'].map((s, i) => ({
      id: `win-con-${i}`,
      draw_id: 'draw-test-kn-642',
      prize_category_id: 'cat-con',
      series: s,
      ticket_number: '422635',
      full_ticket: `${s} 422635`,
      is_consolation: true,
      source_line: 16
    })),
    // 2nd Prize: MX 806042
    {
      id: 'win-2',
      draw_id: 'draw-test-kn-642',
      prize_category_id: 'cat-2',
      series: 'MX',
      ticket_number: '806042',
      full_ticket: 'MX 806042',
      is_consolation: false,
      source_line: 20
    },
    // 4th Prize (Last Four Digits: 3937)
    {
      id: 'win-4-1',
      draw_id: 'draw-test-kn-642',
      prize_category_id: 'cat-4',
      ticket_number: '3937',
      matched_suffix: '3937',
      full_ticket: '3937',
      is_consolation: false,
      source_line: 25
    }
  ];

  // SPEC 71: CRITICAL TEST SUITE
  describe('Spec 71 Critical Test Suite', () => {
    it('MU 422635 -> First Prize (₹1,00,00,000)', () => {
      const res = checkTicket(publishedWeeklyDraw, prizeCategories, winningEntries, 'MU 422635');
      assert.strictEqual(res.status, 'WIN');
      assert.strictEqual(res.verified, true);
      assert.strictEqual(res.prize?.categoryCode, 'I');
      assert.strictEqual(res.prize?.amount, 10000000);
      assert.strictEqual(res.match?.type, 'EXACT_FULL_TICKET');
    });

    it('MN 422635 -> Consolation Prize (₹8,000)', () => {
      const res = checkTicket(publishedWeeklyDraw, prizeCategories, winningEntries, 'MN 422635');
      assert.strictEqual(res.status, 'WIN');
      assert.strictEqual(res.verified, true);
      assert.strictEqual(res.prize?.categoryCode, 'CONSOLATION');
      assert.strictEqual(res.prize?.amount, 8000);
      assert.strictEqual(res.match?.type, 'CONSOLATION');
    });

    it('MO 422635 -> Consolation Prize (₹8,000)', () => {
      const res = checkTicket(publishedWeeklyDraw, prizeCategories, winningEntries, 'MO 422635');
      assert.strictEqual(res.status, 'WIN');
      assert.strictEqual(res.verified, true);
      assert.strictEqual(res.prize?.categoryCode, 'CONSOLATION');
      assert.strictEqual(res.prize?.amount, 8000);
      assert.strictEqual(res.match?.type, 'CONSOLATION');
    });

    it('MU 123937 -> Applicable last-four prize (3937)', () => {
      const res = checkTicket(publishedWeeklyDraw, prizeCategories, winningEntries, 'MU 123937');
      assert.strictEqual(res.status, 'WIN');
      assert.strictEqual(res.verified, true);
      assert.strictEqual(res.prize?.categoryCode, 'IV');
      assert.strictEqual(res.prize?.amount, 5000);
      assert.strictEqual(res.match?.type, 'LAST_N_DIGITS');
    });

    it('MU 123938 -> Off-by-one near miss for 4th Prize (3937 vs 3938)', () => {
      const res = checkTicket(publishedWeeklyDraw, prizeCategories, winningEntries, 'MU 123938');
      assert.strictEqual(res.status, 'NO_WINNING_RESULT_FOUND');
      assert.strictEqual(res.verified, true);
      assert.strictEqual(res.prize, undefined);
      assert.ok(res.nearestMiss, 'Expected nearestMiss for 1 number difference');
      assert.strictEqual(res.nearestMiss?.isJustMissed, true);
      assert.strictEqual(res.nearestMiss?.winningNumber, '3937');
      assert.strictEqual(res.nearestMiss?.prizeCategoryCode, 'IV');
    });

    it('MU 100000 -> Far away from any winning number, nearestMiss should be undefined (shows normally)', () => {
      const res = checkTicket(publishedWeeklyDraw, prizeCategories, winningEntries, 'MU 100000');
      assert.strictEqual(res.status, 'NO_WINNING_RESULT_FOUND');
      assert.strictEqual(res.verified, true);
      assert.strictEqual(res.prize, undefined);
      assert.strictEqual(res.nearestMiss, undefined, 'Should be undefined when not off by 1');
    });

    it('MU 422636 -> Off-by-one near miss for 1st Prize (₹1,00,00,000)', () => {
      const res = checkTicket(publishedWeeklyDraw, prizeCategories, winningEntries, 'MU 422636');
      assert.strictEqual(res.status, 'NO_WINNING_RESULT_FOUND');
      assert.ok(res.nearestMiss, 'Expected nearestMiss to be present');
      assert.strictEqual(res.nearestMiss?.winningTicket, 'MU 422635');
      assert.strictEqual(res.nearestMiss?.formattedAmount, '₹1,00,00,000');
      assert.strictEqual(res.nearestMiss?.isJustMissed, true);
      assert.strictEqual(res.nearestMiss?.differenceType, 'OFF_BY_ONE_NUM');
      assert.strictEqual(res.nearestMiss?.numericDiff, 1);
    });

    it('MU 422685 -> 50 numbers away (digit change), nearestMiss should be undefined (shows normally)', () => {
      const res = checkTicket(publishedWeeklyDraw, prizeCategories, winningEntries, 'MU 422685');
      assert.strictEqual(res.status, 'NO_WINNING_RESULT_FOUND');
      assert.strictEqual(res.verified, true);
      assert.strictEqual(res.nearestMiss, undefined, 'Only exact 1-number misses should trigger near miss');
    });
  });

  // SPEC 72: BUMPER TEST SUITE (LAST 5 DIGITS)
  describe('Spec 72 Bumper Matching Rules', () => {
    const bumperDraw: Draw = {
      ...publishedWeeklyDraw,
      id: 'draw-bumper-thiruvonam',
      draw_number: 'BR-99',
      series_list: ['TA', 'TB', 'TC', 'TD', 'TE', 'TG']
    };

    const bumperCategories: PrizeCategory[] = [
      {
        id: 'cat-br-1',
        draw_id: 'draw-bumper-thiruvonam',
        category_code: 'I',
        category_name_en: 'First Prize',
        category_name_ml: 'ഒന്നാം സമ്മാനം',
        prize_amount: 250000000,
        match_type: 'EXACT_FULL_TICKET',
        match_digits: 6,
        series_scope: 'ALL_SERIES',
        priority: 1
      },
      {
        id: 'cat-br-one-per-series',
        draw_id: 'draw-bumper-thiruvonam',
        category_code: 'II',
        category_name_en: 'Second Prize (1 Cr each series)',
        category_name_ml: 'രണ്ടാം സമ്മാനം',
        prize_amount: 10000000,
        match_type: 'EXACT_NUMBER_PER_SERIES',
        match_digits: 6,
        series_scope: 'ONE_PER_SERIES',
        priority: 2
      },
      {
        id: 'cat-br-last5',
        draw_id: 'draw-bumper-thiruvonam',
        category_code: 'IV',
        category_name_en: 'Fourth Prize (Last 5 Digits)',
        category_name_ml: 'നാലാം സമ്മാനം',
        prize_amount: 500000,
        match_type: 'LAST_N_DIGITS',
        match_digits: 5,
        series_scope: 'ALL_SERIES',
        priority: 4
      }
    ];

    const bumperEntries: WinningEntry[] = [
      // 1st Prize: TG 439120
      {
        id: 'w-b1',
        draw_id: 'draw-bumper-thiruvonam',
        prize_category_id: 'cat-br-1',
        series: 'TG',
        ticket_number: '439120',
        full_ticket: 'TG 439120',
        is_consolation: false
      },
      // 2nd Prize One per series: TA 123456
      {
        id: 'w-b2-ta',
        draw_id: 'draw-bumper-thiruvonam',
        prize_category_id: 'cat-br-one-per-series',
        series: 'TA',
        ticket_number: '123456',
        full_ticket: 'TA 123456',
        is_consolation: false
      },
      // Last 5 digits: 54321
      {
        id: 'w-b4-1',
        draw_id: 'draw-bumper-thiruvonam',
        prize_category_id: 'cat-br-last5',
        ticket_number: '54321',
        matched_suffix: '54321',
        full_ticket: '54321',
        is_consolation: false
      }
    ];

    it('Uses slice(-5) for bumper 5-digit rules: TA 954321 matches', () => {
      const res = checkTicket(bumperDraw, bumperCategories, bumperEntries, 'TA 954321');
      assert.strictEqual(res.status, 'WIN');
      assert.strictEqual(res.prize?.categoryCode, 'IV');
      assert.strictEqual(res.match?.type, 'LAST_N_DIGITS');
    });

    it('Does NOT match when only 4 digits match: TA 904321 fails', () => {
      const res = checkTicket(bumperDraw, bumperCategories, bumperEntries, 'TA 904321');
      assert.strictEqual(res.status, 'NO_WINNING_RESULT_FOUND');
    });

    it('One-per-series exact match for TA 123456', () => {
      const res = checkTicket(bumperDraw, bumperCategories, bumperEntries, 'TA 123456');
      assert.strictEqual(res.status, 'WIN');
      assert.strictEqual(res.prize?.categoryCode, 'II');
      assert.strictEqual(res.match?.type, 'EXACT_NUMBER_PER_SERIES');
    });

    it('One-per-series rejects different series: TB 123456 fails', () => {
      const res = checkTicket(bumperDraw, bumperCategories, bumperEntries, 'TB 123456');
      assert.strictEqual(res.status, 'NO_WINNING_RESULT_FOUND');
    });
  });

  // SAFETY & VERIFICATION GUARDRAILS
  describe('Safety & Verification Guardrails', () => {
    it('Refuses to evaluate unverified draws (DRAFT / NEEDS_VERIFICATION)', () => {
      const draftDraw: Draw = {
        ...publishedWeeklyDraw,
        status: 'NEEDS_VERIFICATION'
      };
      const res = checkTicket(draftDraw, prizeCategories, winningEntries, 'MU 422635');
      assert.strictEqual(res.status, 'DRAW_NOT_PUBLISHED');
      assert.strictEqual(res.verified, false);
      assert.ok(res.message?.includes("Today's result is being verified"));
    });

    it('Rejects malformed ticket numbers with wrong digit counts (5 digits)', () => {
      const res = checkTicket(publishedWeeklyDraw, prizeCategories, winningEntries, 'MU 42263');
      assert.strictEqual(res.status, 'ERROR');
      assert.strictEqual(res.verified, false);
      assert.ok(res.message?.includes('Kerala lottery numbers must contain exactly 6 digits'));
    });

    it('Rejects series that do not belong to the draw', () => {
      const res = checkTicket(publishedWeeklyDraw, prizeCategories, winningEntries, 'ZZ 422635');
      assert.strictEqual(res.status, 'ERROR');
      assert.strictEqual(res.verified, false);
      assert.ok(res.message?.includes('Series "ZZ" is not part of this draw'));
    });
  });
});
