const themeToggle = document.querySelector('#theme-toggle');
const themeChoices = ['system', 'light', 'dark'];
const themeNames = { system: 'System', light: 'Light', dark: 'Dark' };
const systemTheme = window.matchMedia('(prefers-color-scheme: dark)');
let themeChoice = 'system';

try {
  const savedTheme = localStorage.getItem('personal-site-theme');
  if (['light', 'dark'].includes(savedTheme)) themeChoice = savedTheme;
} catch { /* Device theme still works when storage is unavailable. */ }

function updateTheme() {
  if (themeChoice === 'system') document.documentElement.removeAttribute('data-theme');
  else document.documentElement.dataset.theme = themeChoice;
  themeToggle.dataset.choice = themeChoice;
  const nextTheme = themeChoices[(themeChoices.indexOf(themeChoice) + 1) % themeChoices.length];
  const label = `Theme: ${themeNames[themeChoice]}. Switch to ${themeNames[nextTheme]}.`;
  themeToggle.setAttribute('aria-label', label);
  themeToggle.setAttribute('title', label);
  const dark = themeChoice === 'dark' || (themeChoice === 'system' && systemTheme.matches);
  for (const meta of document.querySelectorAll('meta[name="theme-color"]')) {
    const isDarkMeta = meta.media.includes('dark');
    const useDark = themeChoice === 'system' ? isDarkMeta : dark;
    meta.content = useDark ? '#161c22' : '#f3f5f6';
  }
}

themeToggle.addEventListener('click', () => {
  themeChoice = themeChoices[(themeChoices.indexOf(themeChoice) + 1) % themeChoices.length];
  updateTheme();
  try {
    if (themeChoice === 'system') localStorage.removeItem('personal-site-theme');
    else localStorage.setItem('personal-site-theme', themeChoice);
  } catch { /* The selected theme applies even without storage. */ }
});
systemTheme.addEventListener('change', updateTheme);
window.addEventListener('storage', (event) => {
  if (event.key !== 'personal-site-theme' && event.key !== null) return;
  themeChoice = ['light', 'dark'].includes(event.newValue) ? event.newValue : 'system';
  updateTheme();
});
updateTheme();

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const desktopLayout = window.matchMedia('(min-width: 901px)');
const images = [...document.querySelectorAll('[data-view]')];
const viewButtons = [...document.querySelectorAll('[data-select-view]')];
const viewControls = document.querySelector('.view-controls');
const caption = document.querySelector('#view-caption');
const captions = { orbit: 'Earth from orbit', hardware: 'Solar arrays above Earth', earth: 'Mount Etna from the ISS', motion: 'A moving point of view' };

function showView(view) {
  if (!captions[view]) return;
  for (const image of images) {
    const active = image.dataset.view === view;
    if (active) image.classList.add('is-active');
    else image.classList.remove('is-active');
    image.setAttribute('aria-hidden', String(!active));
  }
  for (const button of viewButtons) button.setAttribute('aria-pressed', String(button.dataset.selectView === view));
  if (caption) caption.textContent = captions[view];
}
for (const button of viewButtons) button.addEventListener('click', () => showView(button.dataset.selectView));
if (viewControls) viewControls.hidden = false;

const navigationLinks = [...document.querySelectorAll('.main-nav a')];
const navigationSections = [...document.querySelectorAll('main section[id]')];
let navigationFrame = 0;
let activeSection = '';
function updateNavigation() {
  if (!navigationSections.length) return;
  const scroller = document.scrollingElement || document.documentElement;
  const maxScroll = scroller.scrollHeight - scroller.clientHeight;
  const atBottom = maxScroll > 2 && maxScroll - scroller.scrollTop <= 2;
  let current = navigationSections[0];
  if (atBottom) current = navigationSections[navigationSections.length - 1];
  else {
    const readingLine = window.innerHeight * 0.32;
    for (const section of navigationSections) {
      if (section.getBoundingClientRect().top <= readingLine) current = section;
    }
  }
  for (const link of navigationLinks) {
    if (link.hash === '#' + current.id) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  }
  // Only a new chapter changes the photograph, so a manual choice is stable.
  // On phones the photo is inline: scrolling must not change an off-screen image.
  if (current.id !== activeSection) {
    if (desktopLayout.matches && !reducedMotion.matches && current.dataset.scene) showView(current.dataset.scene);
    activeSection = current.id;
  }
}
function scheduleNavigation() {
  if (navigationFrame) return;
  navigationFrame = requestAnimationFrame(() => { navigationFrame = 0; updateNavigation(); });
}
window.addEventListener('scroll', scheduleNavigation, { passive: true });
window.addEventListener('resize', scheduleNavigation);
window.addEventListener('load', scheduleNavigation);
if ('ResizeObserver' in window) new ResizeObserver(scheduleNavigation).observe(document.body);
updateNavigation();

// Visible by default. Animation starts only after observation; failed or absent
// JavaScript never conceals text. One pass, with small staggered entrances.
if ('IntersectionObserver' in window) {
  const reveal = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      if (!reducedMotion.matches) entry.target.classList.add('entered');
      reveal.unobserve(entry.target);
    }
  }, { threshold: 0.15 });
  for (const section of document.querySelectorAll('section')) {
    [...section.querySelectorAll('[data-reveal]')].forEach((element, i) => {
      element.style.setProperty('--delay', Math.min(i, 3) * 70 + 'ms');
      reveal.observe(element);
    });
  }
}

const credits = document.querySelector('#image-credits');
function revealCredits() { if (credits && window.location.hash === '#image-credits') credits.open = true; }
window.addEventListener('hashchange', revealCredits);
revealCredits();
