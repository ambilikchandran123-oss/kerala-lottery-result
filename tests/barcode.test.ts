import { describe, it } from 'node:test';
import assert from 'node:assert';
import { decodeBarcode } from '../src/lib/engine/barcode';

describe('Barcode & QR Payload Inspector (Spec 8)', () => {
  it('identifies direct series and 6 digits as HIGH confidence', () => {
    const res = decodeBarcode('MU 422635', 'CODE_128');
    assert.strictEqual(res.confidence, 'HIGH');
    assert.strictEqual(res.series, 'MU');
    assert.strictEqual(res.ticketNumber, '422635');
  });

  it('identifies concatenated series and number as HIGH confidence', () => {
    const res = decodeBarcode('WA789012', 'QR_CODE');
    assert.strictEqual(res.confidence, 'HIGH');
    assert.strictEqual(res.series, 'WA');
    assert.strictEqual(res.ticketNumber, '789012');
  });

  it('parses ticket parameters from official verification URL', () => {
    const url = 'https://statelottery.kerala.gov.in/verify?ticket=MU422635';
    const res = decodeBarcode(url, 'QR_CODE');
    assert.strictEqual(res.confidence, 'HIGH');
    assert.strictEqual(res.series, 'MU');
    assert.strictEqual(res.ticketNumber, '422635');
  });

  it('marks raw 6 digits as MEDIUM confidence needing series confirmation', () => {
    const res = decodeBarcode('422635', 'CODE_39');
    assert.strictEqual(res.confidence, 'MEDIUM');
    assert.strictEqual(res.series, null);
    assert.strictEqual(res.ticketNumber, '422635');
  });

  it('refuses to guess for ambiguous or internal inventory IDs', () => {
    const crypticPayload = 'INV-BATCH-2026-X992A-STOCK';
    const res = decodeBarcode(crypticPayload, 'CODE_128');
    assert.strictEqual(res.confidence, 'UNIDENTIFIED');
    assert.strictEqual(res.ticketNumber, null);
    assert.ok(res.errorMessage?.includes('could not be safely identified'));
  });
});
