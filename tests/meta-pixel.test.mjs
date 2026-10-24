import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const source = readFileSync(new URL('../features/analytics/meta-pixel.js', import.meta.url), 'utf8');
function load(doNotTrack, legacyDoNotTrack) {
  const scripts = [];
  const window = {doNotTrack: legacyDoNotTrack};
  const document = {
    createElement: () => ({}),
    getElementsByTagName: () => [{parentNode: {insertBefore: script => scripts.push(script)}}],
  };
  runInNewContext(source, {window, document, navigator: {doNotTrack}});
  return {window, scripts};
}

test('both language pages load the pixel once without blocking rendering', () => {
  for (const page of ['index.html', 'ar.html']) {
    const html = readFileSync(new URL(`../${page}`, import.meta.url), 'utf8');
    assert.equal((html.match(/src="features\/analytics\/meta-pixel\.js\?v=1" defer/g) || []).length, 1);
  }
});

test('the Meta library loads asynchronously and queues one PageView for the supplied pixel', () => {
  const {window, scripts} = load('0');
  assert.equal(scripts.length, 1);
  assert.equal(scripts[0].src, 'https://connect.facebook.net/en_US/fbevents.js');
  assert.equal(scripts[0].async, true);
  assert.deepEqual(Array.from(window.fbq.queue, args => Array.from(args)), [
    ['init', '2345746922466023'], ['track', 'PageView'],
  ]);
});

test('Do Not Track prevents the Meta library and tracking queue from being created', () => {
  for (const flags of [['1', undefined], [undefined, '1']]) {
    const {window, scripts} = load(...flags);
    assert.equal(scripts.length, 0);
    assert.equal(window.fbq, undefined);
  }
});

test('an unavailable Meta library leaves the page running with the event queued', () => {
  const {window} = load(undefined);
  assert.equal(window.fbq.queue.length, 2);
  assert.doesNotThrow(() => window.fbq('track', 'PageView'));
});
