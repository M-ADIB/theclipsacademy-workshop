import { CATALOG_URL, CHECKOUT_URL, STAGES, validateCatalog } from './catalog.mjs?v=launch-now-1';
import { mountCountdown } from './countdown.mjs';

const ladder = document.querySelector('.price-ladder');
const price = document.querySelector('.ticket-price');
const note = document.querySelector('[data-pricing-status]');
const countdown = document.querySelector('.pricing-countdown');
let disposeCountdown = () => {};
let refreshTimer;
let stopped = false;
let requestVersion = 0;

function renderCountdown(deadline, label, ended, serverNow) {
  disposeCountdown();
  countdown.replaceChildren();
  countdown.dataset.countdown = deadline;
  countdown.dataset.countdownLabel = label;
  countdown.dataset.countdownEnded = ended;
  const heading = document.createElement('p');
  heading.className = 'countdown-label';
  heading.textContent = label;
  const units = document.createElement('div');
  units.className = 'countdown-units';
  units.hidden = true;
  countdown.append(heading, units);
  const receivedAt = performance.now();
  disposeCountdown = mountCountdown(countdown, () => serverNow + performance.now() - receivedAt);
}

function unavailable(message) {
  disposeCountdown();
  ladder.hidden = true;
  price.classList.add('is-pending');
  price.querySelector(':scope>span').textContent = 'CHECK';
  price.querySelector('b').textContent = 'See checkout for availability';
  note.textContent = message;
  countdown.replaceChildren();
}

async function refresh() {
  if (stopped) return;
  clearTimeout(refreshTimer);
  const version = ++requestVersion;
  try {
    const response = await fetch(CATALOG_URL, { cache: 'no-store', signal: AbortSignal.timeout(10000) });
    if (!response.ok) throw new Error('Pricing is temporarily unavailable.');
    const catalog = validateCatalog(await response.json());
    if (version !== requestVersion || stopped) return;
    if (catalog.status === 'prelaunch') {
      ladder.hidden = true;
      price.classList.add('is-pending');
      price.querySelector(':scope>span').textContent = 'SOON';
      price.querySelector('b').textContent = 'Booking opens October 18';
      note.textContent = 'Registration opens October 18 at 9am Dubai time.';
      renderCountdown(catalog.deadline, 'Registration opens in', 'Registration is opening. Please check checkout.', catalog.serverNow);
    } else if (catalog.status === 'open') {
      ladder.hidden = false;
      price.classList.remove('is-pending');
      price.querySelector(':scope>span').textContent = `$${catalog.stage.amount / 100}`;
      price.querySelector('b').textContent = catalog.stage.label;
      ladder.querySelectorAll('li').forEach(item => item.classList.toggle('current', item.dataset.stage === catalog.stage.code));
      ladder.setAttribute('aria-label', `Ticket prices: ${STAGES.map(s => `$${s.amount / 100}`).join(', ')}. Current ticket $${catalog.stage.amount / 100}.`);
      note.textContent = 'Ticket only. Optional extras are added at checkout.';
      renderCountdown(catalog.deadline, catalog.stage.code === 'final' ? 'Campaign ends in' : `$${catalog.stage.amount / 100} price increases in`, catalog.stage.code === 'final' ? 'The campaign has ended.' : 'Pricing is being updated. Please check checkout.', catalog.serverNow);
      const og = document.querySelector('meta[property="og:description"]');
      if (og) og.content = `Live AI editing workshop on Zoom, November 1 at 7pm Dubai time. Current ticket $${catalog.stage.amount / 100}. Recordings and skills are optional extras.`;
    } else {
      unavailable('Online booking is currently unavailable.');
    }
    const untilBoundary = catalog.deadline ? Date.parse(catalog.deadline) - catalog.serverNow : 60000;
    refreshTimer = setTimeout(refresh, Math.max(1000, Math.min(60000, untilBoundary + 100)));
  } catch {
    if (version !== requestVersion || stopped) return;
    unavailable('Prices could not be loaded. Please check checkout or try again shortly.');
    refreshTimer = setTimeout(refresh, 15000);
  }
}

// Keep the destination fixed. A catalog response cannot redirect visitors elsewhere.
document.querySelectorAll('.nav-cta,.hero-copy .button,.booking-button').forEach(link => { link.href = CHECKOUT_URL; });
addEventListener('pagehide', () => { stopped = true; clearTimeout(refreshTimer); disposeCountdown(); });
addEventListener('pageshow', event => { if (event.persisted) { stopped = false; refresh(); } });
document.addEventListener('visibilitychange', () => { if (!document.hidden) refresh(); });
refresh();
