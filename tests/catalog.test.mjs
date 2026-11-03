import test from 'node:test';
import assert from 'node:assert/strict';
import { validateCatalog } from '../features/pricing/catalog.mjs';
test('checkout remains open until the price boundary', () => {
  const result = validateCatalog({ status: 'open', server_time: '2026-11-06T04:59:59Z', opens_at: '2026-11-03T05:00:00Z', registration_closes_at: '2026-11-28T14:00:00Z', stage: 'launch', stage_ends_at: '2026-11-06T05:00:00Z', ticket_amount: 2400, currency: 'usd', setup_ready: true, checkout_available: true });
  assert.equal(result.stage.amount, 2400);
  assert.equal(result.deadline, '2026-11-06T05:00:00.000Z');
});
