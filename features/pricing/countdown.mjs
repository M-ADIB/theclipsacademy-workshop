import { pricingCopy } from './copy.mjs?v=bilingual-1';

export function countdownState(deadline, now = Date.now()) {
  const target = Date.parse(deadline);
  if (!Number.isFinite(target) || !Number.isFinite(now)) return { status: 'invalid' };
  const seconds = Math.max(0, Math.ceil((target - now) / 1000));
  return {
    status: seconds > 0 ? 'running' : 'ended',
    days: Math.floor(seconds / 86400),
    hours: Math.floor(seconds % 86400 / 3600),
    minutes: Math.floor(seconds % 3600 / 60),
    seconds: seconds % 60
  };
}

export function mountCountdown(element, now = Date.now) {
  const copy = pricingCopy(document.documentElement.lang);
  const label = element.querySelector('.countdown-label');
  const units = element.querySelector('.countdown-units');
  const fields = ['days', 'hours', 'minutes', 'seconds'];
  const values = fields.map(field => {
    const unit = document.createElement('div');
    unit.className = 'countdown-unit';
    const value = document.createElement('strong');
    const name = document.createElement('span');
    name.textContent = copy.units[field];
    unit.append(value, name);
    units.append(unit);
    return value;
  });
  function update() {
    const state = countdownState(element.dataset.countdown, now());
    if (state.status === 'invalid') {
      units.hidden = true;
      return false;
    }
    if (state.status === 'ended') {
      label.textContent = element.dataset.countdownEnded;
      units.hidden = true;
      return false;
    }
    label.textContent = element.dataset.countdownLabel;
    units.hidden = false;
    fields.forEach((field, index) => { values[index].textContent = String(state[field]).padStart(2, '0'); });
    return true;
  }
  let timer;
  if (update()) timer = setInterval(() => { if (!update()) clearInterval(timer); }, 1000);
  return () => clearInterval(timer);
}
