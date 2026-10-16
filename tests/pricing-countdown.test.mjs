import test from 'node:test';
import assert from 'node:assert/strict';
import { countdownState } from '../features/pricing/countdown.mjs';

const deadlines = [
  ['2026-10-18T09:00:00+04:00', '2026-10-18T05:00:00Z'],
  ['2026-10-23T00:00:00+04:00', '2026-10-22T20:00:00Z'],
  ['2026-10-27T00:00:00+04:00', '2026-10-26T20:00:00Z'],
  ['2026-10-31T00:00:00+04:00', '2026-10-30T20:00:00Z']
];
for (const [dubai, utc] of deadlines) {
  test(`Dubai deadline ${dubai} ends at the exact UTC instant`, () => {
    const end = Date.parse(utc);
    assert.deepEqual(countdownState(dubai, end - 1), { status: 'running', days: 0, hours: 0, minutes: 0, seconds: 1 });
    assert.deepEqual(countdownState(dubai, end), { status: 'ended', days: 0, hours: 0, minutes: 0, seconds: 0 });
    assert.equal(countdownState(dubai, end + 86400000).status, 'ended');
  });
}
test('remaining time rolls days, hours and minutes over correctly', () => {
  assert.deepEqual(countdownState(deadlines[0][0], Date.parse(deadlines[0][1]) - 90061000), {
    status: 'running', days: 1, hours: 1, minutes: 1, seconds: 1
  });
});
test('invalid dates and clocks do not render a false countdown', () => {
  assert.deepEqual(countdownState('missing', 0), { status: 'invalid' });
  assert.deepEqual(countdownState(deadlines[0][0], NaN), { status: 'invalid' });
});
