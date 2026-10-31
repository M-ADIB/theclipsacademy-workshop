export const CATALOG_URL = 'https://wsozuygcqgrhcczacjul.supabase.co/functions/v1/workshop-catalog';
export const CHECKOUT_URL = 'https://os.theclips.academy/workshop/checkout';
export const OPENS_AT = '2026-10-16T19:18:00+04:00';
export const CAMPAIGN_END = '2026-11-01T18:31:00+04:00';
const DISCOUNT_START = '2026-10-30T00:00:00+04:00';
export const STAGES = [
  { code: 'early', amount: 4700, end: '2026-10-23T00:00:00+04:00', label: 'Early booking price' },
  { code: 'standard', amount: 6700, end: '2026-10-27T00:00:00+04:00', label: 'Standard price' },
  { code: 'final', amount: 9700, end: CAMPAIGN_END, label: 'Final booking price' }
];

export function validateCatalog(raw) {
  if (!raw || !['prelaunch', 'open', 'unavailable'].includes(raw.status) || !Number.isFinite(Date.parse(raw.server_time))) {
    throw new Error('Pricing is temporarily unavailable.');
  }
  const serverNow = Date.parse(raw.server_time);
  if (raw.status === 'prelaunch') {
    if (serverNow >= Date.parse(OPENS_AT)) throw new Error('Pricing is being updated.');
    return { status: 'prelaunch', serverNow, deadline: OPENS_AT };
  }
  if (raw.status === 'open' && raw.setup_ready !== true) throw new Error('Checkout is temporarily unavailable.');
  if (raw.status === 'unavailable') return { status: 'unavailable', serverNow };
  let stage = STAGES.find(s => serverNow < Date.parse(s.end));
  if (stage?.code === 'final' && raw.ticket_amount === 4700 && serverNow >= Date.parse(DISCOUNT_START)) {
    stage = { ...stage, amount: 4700 };
  }
  if (serverNow < Date.parse(OPENS_AT) || !stage || raw.stage !== stage.code || raw.ticket_amount !== stage.amount || raw.currency !== 'usd') {
    throw new Error('Pricing is being updated.');
  }
  const boundaryNear=serverNow>Date.parse(stage.end)-31*60000;
  if(!boundaryNear && raw.checkout_available!==true)throw new Error('Checkout is temporarily unavailable.');
  const deadline = boundaryNear ? stage.end : new Date(Date.parse(stage.end) - 31 * 60000).toISOString();
  return { status: boundaryNear?'paused':'open', serverNow, stage, deadline, resumes:stage.code==='final'?null:stage.end };
}
