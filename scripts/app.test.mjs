import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

const source = await readFile(new URL('../app.js', import.meta.url), 'utf8');

class Element extends EventTarget {
  constructor() {
    super();
    this.children = [];
    this.properties = new Map();
    const classes = new Set();
    this.classList = {
      add: name => classes.add(name), remove: name => classes.delete(name),
      contains: name => classes.has(name),
    };
    this.style = {
      setProperty: (name, value) => this.properties.set(name, value),
      removeProperty: name => this.properties.delete(name),
    };
  }
  append(node) {
    if (node.parentElement) {
      node.parentElement.children = node.parentElement.children.filter(child => child !== node);
    }
    node.parentElement = this;
    this.children.push(node);
  }
  getBoundingClientRect() { return { left: 20, top: 80, width: 300, height: 260 }; }
}

function runtime({ fine = true, reduced = false, mobile = false } = {}) {
  const elements = Object.fromEntries([
    '#theme-select', '#card-stage', '#profile-badge', '#profile-info',
    '#profile-bio', '#profile-introduction',
  ].map(selector => [selector, new Element()]));
  elements['#profile-info'].append(elements['#profile-bio']);
  const media = new Map();
  for (const [query, matches] of [
    ['(prefers-color-scheme: dark)', false],
    ['(hover: hover) and (pointer: fine)', fine],
    ['(prefers-reduced-motion: reduce)', reduced],
    ['(max-width: 600px)', mobile],
  ]) {
    const value = new EventTarget();
    value.matches = matches;
    value.set = next => { value.matches = next; value.dispatchEvent(new Event('change')); };
    media.set(query, value);
  }
  const window = new EventTarget();
  window.matchMedia = query => {
    assert.ok(media.has(query), `Unknown media query: ${query}`);
    return media.get(query);
  };
  const root = new Element();
  root.dataset = {};
  root.removeAttribute = () => {};
  const frames = new Map();
  let nextFrame = 0;
  vm.runInNewContext(source, {
    document: { querySelector: selector => elements[selector], querySelectorAll: () => [], documentElement: root },
    window,
    localStorage: { getItem: () => null, setItem() {}, removeItem() {} },
    requestAnimationFrame: callback => { frames.set(++nextFrame, callback); return nextFrame; },
    cancelAnimationFrame: id => frames.delete(id),
  });
  return {
    ...elements, window, media,
    flush: () => { const callbacks = [...frames.values()]; frames.clear(); callbacks.forEach(callback => callback()); },
    send(type, { target = elements['#card-stage'], ...values } = {}) {
      const event = new Event(type, { cancelable: true });
      Object.assign(event, { pointerType: 'touch', pointerId: 1, isPrimary: true, button: 0, clientX: 230, clientY: 150 }, values);
      target.dispatchEvent(event);
      return event;
    },
  };
}

test('touch press and movement tilt the card without preventing native scrolling, and release resets it', () => {
  const r = runtime({ fine: false });
  const card = r['#profile-badge'];
  const down = r.send('pointerdown');
  r.flush();
  assert.ok(card.classList.contains('is-hovered'));
  assert.notEqual(parseFloat(card.properties.get('--rotate-y')), 0);
  const before = card.properties.get('--pointer-x');
  const move = r.send('pointermove', { clientX: 80 });
  r.flush();
  assert.notEqual(card.properties.get('--pointer-x'), before);
  assert.equal(down.defaultPrevented, false);
  assert.equal(move.defaultPrevented, false);
  r.send('pointerup', { target: r.window });
  assert.equal(card.classList.contains('is-hovered'), false);
  assert.equal(card.properties.size, 0);
});

test('pointer cancellation removes pending touch feedback before a scroll', () => {
  const r = runtime({ fine: false });
  r.send('pointerdown');
  r.send('pointercancel');
  r.flush();
  assert.equal(r['#profile-badge'].properties.size, 0);
  assert.equal(r['#profile-badge'].classList.contains('is-hovered'), false);
});

test('ignores touch movement without a press and secondary touches', () => {
  const r = runtime({ fine: false });
  r.send('pointermove');
  r.send('pointerdown', { isPrimary: false, pointerId: 2 });
  r.flush();
  assert.equal(r['#profile-badge'].properties.size, 0);
  assert.equal(r['#profile-badge'].classList.contains('is-hovered'), false);
});

test('reduced motion disables touch effects and clears an active gesture when enabled', () => {
  const r = runtime({ fine: false, reduced: true });
  r.send('pointerdown');
  r.flush();
  assert.equal(r['#profile-badge'].properties.size, 0);
  r.media.get('(prefers-reduced-motion: reduce)').set(false);
  r.send('pointerdown');
  r.flush();
  assert.ok(r['#profile-badge'].properties.size > 0);
  r.media.get('(prefers-reduced-motion: reduce)').set(true);
  assert.equal(r['#profile-badge'].properties.size, 0);
});

test('mouse hover keeps the existing tilt and resets when leaving', () => {
  const r = runtime();
  r.send('pointerenter', { pointerType: 'mouse' });
  r.send('pointermove', { pointerType: 'mouse' });
  r.flush();
  assert.ok(r['#profile-badge'].classList.contains('is-hovered'));
  assert.ok(Math.abs(parseFloat(r['#profile-badge'].properties.get('--rotate-y')) - 1.6) < 0.0001);
  r.send('pointerleave', { pointerType: 'mouse' });
  assert.equal(r['#profile-badge'].properties.size, 0);
});

test('moves the single biography outside the sleeve on phones and back on wider screens', () => {
  const r = runtime({ mobile: true });
  const bio = r['#profile-bio'];
  assert.equal(bio.parentElement, r['#profile-introduction']);
  r.media.get('(max-width: 600px)').set(false);
  assert.equal(bio.parentElement, r['#profile-info']);
  r.media.get('(max-width: 600px)').set(true);
  assert.equal(bio.parentElement, r['#profile-introduction']);
  assert.equal(r['#profile-introduction'].children.length, 1);
});
