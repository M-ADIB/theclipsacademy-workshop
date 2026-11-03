import test from 'node:test';
import assert from 'node:assert/strict';
import { validateCatalog } from '../features/pricing/catalog.mjs';
const opens_at = '2026-11-03T05:00:00Z';
const registration_closes_at = '2026-11-28T14:00:00Z';
const catalog = (server_time, stage, ticket_amount, stage_ends_at) => ({ status: 'open', server_time, opens_at, registration_closes_at, stage, ticket_amount, stage_ends_at, currency: 'usd', setup_ready: true, checkout_available: true });
for (const [time, stage, amount, end] of [
  ['2026-11-03T05:00:00Z', 'launch', 2400, '2026-11-06T05:00:00Z'],
  ['2026-11-06T05:00:00Z', 'early', 4600, '2026-11-13T16:00:00Z'],
  ['2026-11-13T16:00:00Z', 'standard', 6800, '2026-11-21T03:00:00Z'],
  ['2026-11-21T03:00:00Z', 'final', 8800, '2026-11-28T14:00:00Z'],
]) test(`catalog validates ${stage} at its boundary`, () => assert.equal(validateCatalog(catalog(time, stage, amount, end)).stage.amount, amount));
test('rejects a mismatched price, stage or deadline', () => {
  const valid = catalog('2026-11-06T05:00:00Z', 'early', 4600, '2026-11-13T16:00:00Z');
  for (const patch of [{ ticket_amount: 2400 }, { stage: 'launch' }, { stage_ends_at: '2026-11-14T16:00:00Z' }, { setup_ready: false }]) assert.throws(() => validateCatalog({ ...valid, ...patch }));
});
test('prelaunch and close are determined by the event schedule', () => {
  assert.equal(validateCatalog({ status: 'prelaunch', server_time: '2026-11-03T04:59:59Z', opens_at, registration_closes_at }).status, 'prelaunch');
  assert.equal(validateCatalog({ status: 'unavailable', server_time: registration_closes_at, opens_at, registration_closes_at }).status, 'unavailable');
});
