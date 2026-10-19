import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { pricingCopy } from '../features/pricing/copy.mjs';
import { STAGES, CHECKOUT_URL } from '../features/pricing/catalog.mjs';

const english = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const arabic = readFileSync(new URL('../ar.html', import.meta.url), 'utf8');

test('language pages preserve the same checkout destinations, sections and media', () => {
  const values = (html, pattern) => [...html.matchAll(pattern)].map(m => m[1]);
  assert.deepEqual(values(arabic, /<section[^>]* id="([^"]+)"/g), values(english, /<section[^>]* id="([^"]+)"/g));
  assert.deepEqual(values(arabic, /<video[^>]* src="([^"]+)"/g), values(english, /<video[^>]* src="([^"]+)"/g));
  for (const html of [english, arabic]) {
    const checkout = values(html, /href="(https:\/\/os[^\"]+)"/g);
    assert.equal(checkout.length, 3);
    assert.ok(checkout.every(url => url === CHECKOUT_URL));
    for (const src of values(html, /(?:src|poster)="(assets\/[^\"]+)"/g)) {
      assert.ok(existsSync(new URL(`../${src}`, import.meta.url)), `Missing ${src}`);
    }
  }
});

test('Arabic is available without JavaScript and declares its language and direction', () => {
  assert.match(arabic, /<html lang="ar" dir="rtl">/);
  assert.match(arabic, /href="\.\/" lang="en"/);
  assert.match(english, /href="ar.html" lang="ar"/);
  assert.match(arabic, /الورشة متاحة بالعربية والإنجليزية/);
  assert.match(english, /Available in both English and Arabic/);
  const text = arabic.replace(/<[^>]*>/g, ' ').replace(/&[a-z]+;/gi, ' ');
  const latin = text.match(/[A-Za-z]+/g) || [];
  assert.ok(latin.every(word => ['English', 'EN', 'ChatGPT', 'Claude'].includes(word)), latin.join(', '));
});

test('every price stage and countdown unit has Arabic copy without changing amounts', () => {
  const copy = pricingCopy('ar');
  for (const stage of STAGES) {
    assert.match(copy.stages[stage.code], /[\u0600-\u06ff]/);
    assert.ok(copy.prices(STAGES, stage.amount).includes(`${stage.amount / 100} دولار`));
    assert.ok(copy.increaseCountdown(stage.amount).includes(`${stage.amount / 100} دولار`));
  }
  assert.deepEqual(Object.keys(copy.units), ['days', 'hours', 'minutes', 'seconds']);
  const messages = [...Object.values(copy).filter(v => typeof v === 'string'), ...Object.values(copy.units)];
  assert.ok(messages.every(message => /[\u0600-\u06ff]/.test(message) && !/[A-Za-z]/.test(message)));
  assert.equal(pricingCopy('en').stages.early, STAGES[0].label);
});

test('all language metadata points to the matching canonical and alternate pages', () => {
  for (const html of [english, arabic]) {
    assert.match(html, /hreflang="en" href="https:\/\/theclips.academy\/"/);
    assert.match(html, /hreflang="ar" href="https:\/\/theclips.academy\/ar.html"/);
  }
  assert.match(arabic, /rel="canonical" href="https:\/\/theclips.academy\/ar.html"/);
});
