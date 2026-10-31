import test from 'node:test';
import assert from 'node:assert/strict';
import { validateCatalog } from '../features/pricing/catalog.mjs';
const catalog = (time, stage, ticket_amount) => ({ status: 'open', server_time: time, stage, ticket_amount, currency: 'usd', setup_ready: true, checkout_available: true });
for (const [time, stage, amount] of [
  ['2026-10-16T15:18:00Z', 'early', 4700],
  ['2026-10-22T19:59:59Z', 'early', 4700],
  ['2026-10-22T20:00:00Z', 'standard', 6700],
  ['2026-10-26T20:00:00Z', 'final', 9700],
  ['2026-10-30T19:59:59Z', 'final', 9700]
]) test(`server catalog uses correct Dubai stage at ${time}`, () => assert.equal(validateCatalog(catalog(time, stage, amount)).stage.code, stage));
test('no ticket price is displayed before launch or after the campaign', () => {
  assert.throws(() => validateCatalog(catalog('2026-10-16T15:17:59Z', 'early', 4700)));
  assert.throws(() => validateCatalog(catalog('2026-11-01T14:31:00Z', 'final', 4700)));
  assert.equal(validateCatalog({status:'prelaunch',server_time:'2026-10-16T15:17:59Z'}).status,'prelaunch');
});
test('stale stage, old prices, wrong currency and malformed catalogs fail closed', () => {
  for (const raw of [catalog('2026-10-23T00:00:00Z','early',4700),catalog('2026-10-18T06:00:00Z','early',1900),{...catalog('2026-10-18T06:00:00Z','early',4700),currency:'aed'},null,{}, {status:'prelaunch',server_time:'2026-10-18T05:00:00Z'}]) assert.throws(()=>validateCatalog(raw));
});

test('incomplete backend setup does not advertise an available checkout', () => {
  assert.throws(() => validateCatalog({...catalog('2026-10-18T06:00:00Z','early',4700),setup_ready:false}));
});

test('extended $47 offer closes new checkout at 6pm Dubai', () => {
  const open=validateCatalog(catalog('2026-11-01T13:59:59Z','final',4700));
  assert.equal(open.stage.amount,4700);
  assert.equal(open.deadline,'2026-11-01T14:00:00.000Z');
  const paused=validateCatalog({...catalog('2026-11-01T14:00:01Z','final',4700),checkout_available:false,checkout_pause_reason:'boundary_near'});
  assert.equal(paused.status,'paused');
  assert.equal(paused.resumes,null);
});

test('restored $97 final offer uses the same Sunday cutoff', () => {
  const open = validateCatalog(catalog('2026-10-31T08:00:00Z','final',9700));
  assert.equal(open.stage.amount,9700);
  assert.equal(open.deadline,'2026-11-01T14:00:00.000Z');
  const paused = validateCatalog({...catalog('2026-11-01T14:00:01Z','final',9700),checkout_available:false,checkout_pause_reason:'boundary_near'});
  assert.equal(paused.status,'paused');
  assert.equal(paused.resumes,null);
});
