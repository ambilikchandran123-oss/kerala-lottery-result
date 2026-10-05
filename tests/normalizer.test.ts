import { describe, it } from 'node:test';
import assert from 'node:assert';
import { normalizeTicket } from '../src/lib/engine/normalizer';

describe('Kerala Ticket Normalizer (Spec 7)', () => {
  it('normalizes formatted variations correctly', () => {
    const variations = [
      'MU422635',
      'MU 422635',
      'MU-422635',
      'mu 422635',
      '  mu422635  '
    ];

    for (const input of variations) {
      const result = normalizeTicket(input);
      assert.strictEqual(result.valid, true);
      assert.strictEqual(result.normalized_series, 'MU');
      assert.strictEqual(result.normalized_number, '422635');
      assert.strictEqual(result.normalized_full_ticket, 'MU 422635');
      assert.strictEqual(result.raw_input, input);
    }
  });

  it('rejects numbers with fewer than 6 digits without silent modification', () => {
    const result = normalizeTicket('MU 42263'); // 5 digits
    assert.strictEqual(result.valid, false);
    assert.ok(result.error?.includes('Kerala lottery numbers must contain exactly 6 digits'));
  });

  it('rejects numbers with more than 6 digits without silent truncation', () => {
    const result = normalizeTicket('MU 4226359'); // 7 digits
    assert.strictEqual(result.valid, false);
    assert.ok(result.error?.includes('Kerala lottery numbers must contain exactly 6 digits'));
  });

  it('enforces series membership against draw series list', () => {
    const allowedSeries = ['MA', 'MB', 'MC', 'MD'];
    const valid = normalizeTicket('MA 123456', allowedSeries);
    assert.strictEqual(valid.valid, true);

    const invalid = normalizeTicket('ZZ 123456', allowedSeries);
    assert.strictEqual(invalid.valid, false);
    assert.ok(invalid.error?.includes('Series "ZZ" is not part of this draw'));
  });
});
