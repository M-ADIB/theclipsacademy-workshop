export const CATALOG_URL = 'https://wsozuygcqgrhcczacjul.supabase.co/functions/v1/workshop-catalog';
export const CHECKOUT_URL = 'https://os.theclips.academy/workshop/checkout';
export const STAGES = [
  { code: 'launch', amount: 2400 },
  { code: 'early', amount: 4600 },
  { code: 'standard', amount: 6800 },
  { code: 'final', amount: 8800 },
];

export function validateCatalog(raw) {
  if (!raw || !['prelaunch', 'open', 'unavailable'].includes(raw.status)) throw new Error('Pricing is temporarily unavailable.');
  const now = Date.parse(raw.server_time);
  const start = Date.parse(raw.opens_at);
  const close = Date.parse(raw.registration_closes_at);
  const earlyEnd = start + 72 * 3600_000;
  if (![now, start, close].every(Number.isFinite) || close <= earlyEnd) throw new Error('Pricing is being updated.');
  if (raw.status === 'prelaunch') {
    if (now >= start) throw new Error('Pricing is being updated.');
    return { status: 'prelaunch', serverNow: now, deadline: raw.opens_at };
  }
  if (raw.status === 'unavailable') {
    if (now < close) throw new Error('Pricing is being updated.');
    return { status: 'unavailable', serverNow: now };
  }
  const remaining = close - earlyEnd;
  const ends = [earlyEnd, earlyEnd + Math.floor(remaining / 3), earlyEnd + Math.floor(remaining * 2 / 3), close];
  const index = ends.findIndex(end => now < end);
  const stage = STAGES[index];
  if (now < start || !stage || raw.stage !== stage.code || raw.ticket_amount !== stage.amount || raw.currency !== 'usd' || Date.parse(raw.stage_ends_at) !== ends[index]) throw new Error('Pricing is being updated.');
  if (raw.setup_ready !== true || raw.checkout_available !== true) throw new Error('Checkout is temporarily unavailable.');
  return { status: 'open', serverNow: now, stage, deadline: new Date(ends[index]).toISOString() };
}
