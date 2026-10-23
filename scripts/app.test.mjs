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

function runtime({ reduced = false, desktop = true, savedTheme = null, storageUnavailable = false, scrollTop = 0, hash = '' } = {}) {
  const selectors = ['#theme-toggle', '.view-controls', '#view-caption', '#image-credits'];
  const elements = Object.fromEntries(selectors.map(selector => [selector, new Element()]));
  const views = ['orbit', 'hardware', 'earth', 'motion'];
  const images = views.map(view => Object.assign(new Element(), { dataset: { view } }));
  images[0].classList.add('is-active');
  const buttons = views.map(selectView => Object.assign(new Element(), { dataset: { selectView } }));
  const ids = ['profile', 'research', 'publications', 'articles', 'links'];
  const navLinks = ids.slice(1).map(id => Object.assign(new Element(), { hash: '#' + id }));
  const root = Object.assign(new Element(), { scrollTop, scrollHeight: 3000, clientHeight: 900 });
  const sections = ids.map((id, i) => ({ id, dataset: { scene: views[i] }, getBoundingClientRect: () => ({ top: i * 600 - root.scrollTop }) }));
  const window = new EventTarget();
  window.innerHeight = 900;
  window.location = { hash };
  const media = new Map();
  for (const [query, matches] of [
    ['(prefers-color-scheme: dark)', false],
    ['(prefers-reduced-motion: reduce)', reduced],
    ['(min-width: 901px)', desktop],
  ]) {
    const value = new EventTarget();
    value.matches = matches;
    value.set = next => { value.matches = next; value.dispatchEvent(new Event('change')); };
    media.set(query, value);
  }
  window.matchMedia = query => { assert.ok(media.has(query)); return media.get(query); };
  const stored = new Map(savedTheme ? [['personal-site-theme', savedTheme]] : []);
  const storage = action => { if (storageUnavailable) throw new Error('Storage unavailable'); return action(); };
  const frames = new Map();
  let nextFrame = 0;
  const all = { '[data-view]': images, '[data-select-view]': buttons, '.main-nav a': navLinks, 'main section[id]': sections };
  vm.runInNewContext(source, {
    document: { querySelector: s => elements[s], querySelectorAll: s => all[s] || [], documentElement: root, scrollingElement: root },
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
    ...elements, window, media, root, stored, navLinks, images, buttons,
    flush: () => { const callbacks = [...frames.values()]; frames.clear(); callbacks.forEach(callback => callback()); },
    send(type, { target = window, ...values } = {}) { const event = new Event(type); Object.assign(event, values); target.dispatchEvent(event); },
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


function activeView(r) { return r.images.filter(i => i.classList.contains('is-active')).map(i => i.dataset.view); }
function activeNav(r) { return r.navLinks.filter(a => a.getAttribute('aria-current') === 'location').map(a => a.hash); }

test('image selectors expose one image, update pressed state and give its caption', () => {
  const r = runtime();
  assert.equal(r['.view-controls'].hidden, false);
  r.buttons[2].dispatchEvent(new Event('click'));
  assert.deepEqual(activeView(r), ['earth']);
  assert.equal(r.buttons[2].getAttribute('aria-pressed'), 'true');
  assert.equal(r.buttons[0].getAttribute('aria-pressed'), 'false');
  assert.equal(r.images[0].getAttribute('aria-hidden'), 'true');
  assert.equal(r.images[2].getAttribute('aria-hidden'), 'false');
  assert.equal(r['#view-caption'].textContent, 'Mount Etna from the ISS');
});

test('desktop chapters update the image without undoing manual choices in the same chapter', () => {
  const r = runtime();
  r.root.scrollTop = 500;
  r.send('scroll'); r.flush();
  assert.deepEqual(activeNav(r), ['#research']);
  assert.deepEqual(activeView(r), ['hardware']);
  r.buttons[3].dispatchEvent(new Event('click'));
  r.root.scrollTop = 550;
  r.send('scroll'); r.flush();
  assert.deepEqual(activeView(r), ['motion']);
  r.root.scrollTop = 1100;
  r.send('scroll'); r.flush();
  assert.deepEqual(activeView(r), ['earth']);
});

test('reduced motion and phone layout keep automatic image changes off, but allow deliberate selection', () => {
  for (const options of [{ reduced: true }, { desktop: false }]) {
    const r = runtime(options);
    r.root.scrollTop = 500;
    r.send('scroll'); r.flush();
    assert.deepEqual(activeView(r), ['orbit']);
    r.buttons[1].dispatchEvent(new Event('click'));
    assert.deepEqual(activeView(r), ['hardware']);
  }
});

test('short final section is selected at page bottom and recalculates when scrolling up', () => {
  const r = runtime({ scrollTop: 2100 });
  assert.deepEqual(activeNav(r), ['#links']);
  r.root.scrollTop = 1900;
  r.send('scroll'); r.flush();
  assert.deepEqual(activeNav(r), ['#articles']);
});

test('a credits deep link opens the disclosure, including after hash navigation', () => {
  const r = runtime({ hash: '#image-credits' });
  assert.equal(r['#image-credits'].open, true);
  const other = runtime();
  other.window.location.hash = '#image-credits';
  other.send('hashchange');
  assert.equal(other['#image-credits'].open, true);
});
