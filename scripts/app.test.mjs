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
    this.attributes = new Map();
    this.dataset = {};
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
  setAttribute(name, value) { this.attributes.set(name, value); }
  getAttribute(name) { return this.attributes.get(name); }
  removeAttribute(name) {
    this.attributes.delete(name);
    if (name.startsWith('data-')) {
      delete this.dataset[name.slice(5).replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())];
    }
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

function runtime({ fine = true, reduced = false, mobile = false, savedTheme = null, storageUnavailable = false, navigation = false, scrollTop = 0, scrollHeight = 1900, viewportHeight = 900 } = {}) {
  const elements = Object.fromEntries([
    '#theme-toggle', '#card-stage', '#profile-badge', '#profile-info',
    '#profile-bio', '#profile-introduction', '.main-nav',
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
  Object.assign(root, { scrollTop, scrollHeight, clientHeight: viewportHeight });
  window.innerHeight = viewportHeight;
  const navLinks = navigation ? ['profile', 'publications', 'articles', 'links'].map(id => {
    const link = new Element();
    link.hash = '#' + id;
    return link;
  }) : [];
  const sections = navLinks.map((link, index) => ({
    id: link.hash.slice(1),
    getBoundingClientRect: () => ({ top: [100, 650, 1000, 1650][index] - root.scrollTop }),
  }));
  const stored = new Map(savedTheme ? [['personal-site-theme', savedTheme]] : []);
  const storage = action => {
    if (storageUnavailable) throw new Error('Storage unavailable');
    return action();
  };
  const frames = new Map();
  let nextFrame = 0;
  vm.runInNewContext(source, {
    document: {
      querySelector: selector => elements[selector],
      querySelectorAll: selector => selector === '.main-nav a' ? navLinks : selector === 'main section[id]' ? sections : [],
      documentElement: root, scrollingElement: root,
    },
    window,
    localStorage: {
      getItem: key => storage(() => stored.get(key) ?? null),
      setItem: (key, value) => storage(() => stored.set(key, value)),
      removeItem: key => storage(() => stored.delete(key)),
    },
    requestAnimationFrame: callback => { frames.set(++nextFrame, callback); return nextFrame; },
    cancelAnimationFrame: id => frames.delete(id),
  });
  return {
    ...elements, window, media, root, stored, navLinks,
    flush: () => { const callbacks = [...frames.values()]; frames.clear(); callbacks.forEach(callback => callback()); },
    send(type, { target = elements['#card-stage'], ...values } = {}) {
      const event = new Event(type, { cancelable: true });
      Object.assign(event, { pointerType: 'touch', pointerId: 1, isPrimary: true, button: 0, clientX: 230, clientY: 150 }, values);
      target.dispatchEvent(event);
      return event;
    },
  };
}

test('theme button cycles System → Light → Dark → System and persists only manual choices', () => {
  const r = runtime();
  const button = r['#theme-toggle'];
  assert.equal(button.dataset.choice, 'system');
  assert.match(button.getAttribute('aria-label'), /Theme: System\. Switch to Light\./);
  for (const choice of ['light', 'dark', 'system']) {
    button.dispatchEvent(new Event('click'));
    assert.equal(button.dataset.choice, choice);
    assert.equal(r.root.dataset.theme, choice === 'system' ? undefined : choice);
    assert.equal(r.stored.get('personal-site-theme'), choice === 'system' ? undefined : choice);
  }
  r.media.get('(prefers-color-scheme: dark)').set(true);
  assert.equal(button.dataset.choice, 'system');
  assert.equal(r.root.dataset.theme, undefined);
});

test('restores the theme button state and synchronizes preferences from other tabs', () => {
  const r = runtime({ savedTheme: 'dark' });
  const button = r['#theme-toggle'];
  assert.equal(button.dataset.choice, 'dark');
  assert.equal(r.root.dataset.theme, 'dark');
  assert.match(button.getAttribute('aria-label'), /Switch to System/);
  r.media.get('(prefers-color-scheme: dark)').set(true);
  assert.equal(button.dataset.choice, 'dark');
  r.send('storage', { target: r.window, key: 'personal-site-theme', newValue: 'light' });
  assert.equal(button.dataset.choice, 'light');
  assert.equal(r.root.dataset.theme, 'light');
  r.send('storage', { target: r.window, key: 'personal-site-theme', newValue: null });
  assert.equal(button.dataset.choice, 'system');
  assert.equal(r.root.dataset.theme, undefined);
});

test('theme cycling still works if local storage is unavailable', () => {
  const r = runtime({ storageUnavailable: true });
  r['#theme-toggle'].dispatchEvent(new Event('click'));
  assert.equal(r.root.dataset.theme, 'light');
});

function activeSection(r) {
  return r.navLinks.filter(link => link.getAttribute('aria-current') === 'location').map(link => link.hash);
}

test('phone navigation starts hidden, shows on an upward finger swipe and hides on a downward swipe', () => {
  const r = runtime({ mobile: true, navigation: true });
  const nav = r['.main-nav'];
  assert.equal(nav.dataset.scrollHidden, 'true');
  r.root.scrollTop = 120;
  r.send('scroll', { target: r.window });
  r.flush();
  assert.equal(nav.dataset.scrollHidden, 'false');
  r.root.scrollTop = 80;
  r.send('scroll', { target: r.window });
  r.flush();
  assert.equal(nav.dataset.scrollHidden, 'true');
});

test('small scroll movements and touch overscroll do not flicker the phone navigation', () => {
  const r = runtime({ mobile: true });
  const nav = r['.main-nav'];
  r.root.scrollTop = -40;
  r.send('scroll', { target: r.window });
  assert.equal(nav.dataset.scrollHidden, 'true');
  r.root.scrollTop = 1000;
  r.send('scroll', { target: r.window });
  assert.equal(nav.dataset.scrollHidden, 'false');
  for (const position of [1030, 1010, 1000, 997]) {
    r.root.scrollTop = position;
    r.send('scroll', { target: r.window });
    assert.equal(nav.dataset.scrollHidden, 'false');
  }
  r.root.scrollTop = 980;
  r.send('scroll', { target: r.window });
  assert.equal(nav.dataset.scrollHidden, 'true');
});

test('mobile toolbar height changes do not erase the swipe direction', () => {
  const r = runtime({ mobile: true });
  r.root.scrollTop = 30;
  r.window.innerHeight = 850;
  r.send('resize', { target: r.window });
  r.send('scroll', { target: r.window });
  assert.equal(r['.main-nav'].dataset.scrollHidden, 'false');
});

test('desktop navigation stays visible and changing layout resets the phone visibility', () => {
  const r = runtime();
  const nav = r['.main-nav'];
  for (const position of [500, 100]) {
    r.root.scrollTop = position;
    r.send('scroll', { target: r.window });
    assert.equal(nav.dataset.scrollHidden, undefined);
  }
  r.media.get('(max-width: 600px)').set(true);
  assert.equal(nav.dataset.scrollHidden, 'true');
  r.root.scrollTop = 300;
  r.send('scroll', { target: r.window });
  assert.equal(nav.dataset.scrollHidden, 'false');
  r.media.get('(max-width: 600px)').set(false);
  assert.equal(nav.dataset.scrollHidden, undefined);
});

test('highlights a short final section at the page bottom and restores Articles when scrolling up', () => {
  const r = runtime({ navigation: true, scrollTop: 990 });
  assert.deepEqual(activeSection(r), ['#articles']);
  // Links starts at 650px in the viewport, below the normal reading line.
  r.root.scrollTop = 999.5;
  r.send('scroll', { target: r.window });
  r.flush();
  assert.deepEqual(activeSection(r), ['#links']);
  r.root.scrollTop = 990;
  r.send('scroll', { target: r.window });
  r.flush();
  assert.deepEqual(activeSection(r), ['#articles']);
});

test('restores Links on a bottom-position reload and recalculates after viewport changes', () => {
  const r = runtime({ navigation: true, scrollTop: 1000 });
  assert.deepEqual(activeSection(r), ['#links']);
  r.root.clientHeight = r.window.innerHeight = 700;
  r.send('resize', { target: r.window });
  r.flush();
  assert.deepEqual(activeSection(r), ['#articles']);
  r.root.scrollTop = 1200;
  r.send('scroll', { target: r.window });
  r.flush();
  assert.deepEqual(activeSection(r), ['#links']);
});

test('a page that fits within the viewport keeps Profile active', () => {
  const r = runtime({ navigation: true, scrollHeight: 1900, viewportHeight: 2000 });
  assert.deepEqual(activeSection(r), ['#profile']);
});

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
