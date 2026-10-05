import { describe, it } from 'node:test';
import assert from 'node:assert';
import { parseLotteryResultText } from '../src/lib/parser/txtParser';
import { calculateSha256 } from '../src/lib/parser/hasher';

describe('Official LOTIS Parser & Checksum Pipeline', () => {
  const sampleGazette = `KERALA STATE LOTTERIES - RESULT
www.keralalotteries.com
PHONE: 0471-2305230, 2305193
KARUNYA PLUS LOTTERY NO. KN-642th DRAW held on 24/09/2026 AT GORKY BHAVAN, THIRUVANANTHAPURAM

1st Prize- Rs :1,00,00,000/-       MU 422635  (KOTTAYAM)

Consolation Prize- Rs. 8,000/-     MN 422635  MO 422635  MP 422635

2nd Prize- Rs :10,00,000/-         MX 806042  (PALAKKAD)

4th Prize- Rs. 5,000/-
0393  0584  0658  1511

The prize winners are advised to verify the winning numbers.`;

  it('computes consistent deterministic SHA-256 hashes', () => {
    const hash1 = calculateSha256(sampleGazette);
    const hash2 = calculateSha256(sampleGazette);
    assert.strictEqual(hash1, hash2);
    assert.strictEqual(hash1.length, 64);
  });

  it('extracts structured lottery name, draw number, date, and categories', () => {
    const parsed = parseLotteryResultText(sampleGazette);
    assert.strictEqual(parsed.success, true);
    assert.strictEqual(parsed.lotteryNameEn, 'Karunya Plus');
    assert.strictEqual(parsed.drawNumber, 'KN-642');
    assert.strictEqual(parsed.drawDate, '2026-09-24');
    assert.strictEqual(parsed.confidence, 'HIGH');
    assert.strictEqual(parsed.confidenceScore, 100);

    // 1st Prize check
    const firstPrizeCat = parsed.categories.find(c => c.categoryCode === 'I');
    assert.ok(firstPrizeCat);
    assert.strictEqual(firstPrizeCat?.amount, 10000000);
    assert.strictEqual(firstPrizeCat?.entries[0].series, 'MU');
    assert.strictEqual(firstPrizeCat?.entries[0].ticketNumber, '422635');

    // Consolation check
    const conCat = parsed.categories.find(c => c.categoryCode === 'CONSOLATION');
    assert.ok(conCat);
    assert.strictEqual(conCat?.entries.length, 3);

    // 4th prize suffix check
    const fourthCat = parsed.categories.find(c => c.categoryCode === 'TIER_4');
    assert.ok(fourthCat);
    assert.strictEqual(fourthCat?.entries.length, 4);
    assert.strictEqual(fourthCat?.entries[0].matchedSuffix, '0393');
  });

  it('flags OCR-derived extraction for mandatory verification', () => {
    const parsed = parseLotteryResultText(sampleGazette, true);
    assert.strictEqual(parsed.ocrUsed, true);
    assert.strictEqual(parsed.confidence, 'MEDIUM');
    assert.ok(parsed.warnings.some(w => w.includes('OCR')));
  });

  it('parses PDF files safely with direct stream extraction fallback', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const { parseLotteryResultPdf } = await import('../src/lib/parser/pdfParser');
    const pdfPath = path.resolve(__dirname, '../public/samples/Karunya_Plus_KN-642_Result.pdf');
    if (fs.existsSync(pdfPath)) {
      const buffer = fs.readFileSync(pdfPath);
      const parsed = await parseLotteryResultPdf(buffer);
      assert.strictEqual(parsed.success, true);
      assert.strictEqual(parsed.lotteryNameEn, 'Karunya Plus');
      assert.strictEqual(parsed.drawNumber, 'KN-642');
      assert.ok(parsed.categories.length > 0);
    }
  });
});
