const themeSelect = document.querySelector('#theme-select');
const systemTheme = window.matchMedia('(prefers-color-scheme: dark)');
let themeChoice = 'system';

try {
  const savedTheme = localStorage.getItem('personal-site-theme');
  if (['light', 'dark'].includes(savedTheme)) themeChoice = savedTheme;
} catch { /* Device theme still works when storage is unavailable. */ }

function updateTheme() {
  if (themeChoice === 'system') document.documentElement.removeAttribute('data-theme');
  else document.documentElement.dataset.theme = themeChoice;
  themeSelect.value = themeChoice;
  const dark = themeChoice === 'dark' || (themeChoice === 'system' && systemTheme.matches);
  for (const meta of document.querySelectorAll('meta[name="theme-color"]')) {
    const isDarkMeta = meta.media.includes('dark');
    const useDark = themeChoice === 'system' ? isDarkMeta : dark;
    meta.content = useDark ? '#101216' : '#f2f4f7';
  }
}

themeSelect.addEventListener('change', () => {
  themeChoice = themeSelect.value;
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
document.documentElement.classList.add('js-ready');

const mobileLayout = window.matchMedia('(max-width: 600px)');
const biography = document.querySelector('#profile-bio');
const profileInfo = document.querySelector('#profile-info');
const introduction = document.querySelector('#profile-introduction');
function placeBiography() {
  const destination = mobileLayout.matches ? introduction : profileInfo;
  if (biography.parentElement !== destination) destination.append(biography);
}
mobileLayout.addEventListener('change', placeBiography);
placeBiography();

const stage = document.querySelector('#card-stage');
const card = document.querySelector('#profile-badge');
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let frame = 0;
let pointer = null;
let contactId = null;

function resetCard() {
  cancelAnimationFrame(frame);
  frame = 0;
  pointer = null;
  contactId = null;
  card.classList.remove('is-hovered');
  card.style.removeProperty('--rotate-x');
  card.style.removeProperty('--rotate-y');
  card.style.removeProperty('--pointer-x');
  card.style.removeProperty('--pointer-y');
}
function canAnimate(pointerType) {
  return !reducedMotion.matches && (
    pointerType === 'touch' || pointerType === 'pen' ||
    (pointerType === 'mouse' && finePointer.matches)
  );
}
function updateCardPointer(event) {
  pointer = { x: event.clientX, y: event.clientY, type: event.pointerType };
  if (frame) return;
  frame = requestAnimationFrame(() => {
    frame = 0;
    if (!pointer || !canAnimate(pointer.type)) return;
    const bounds = stage.getBoundingClientRect();
    const x = Math.min(1, Math.max(0, (pointer.x - bounds.left) / bounds.width));
    const y = Math.min(1, Math.max(0, (pointer.y - bounds.top) / bounds.height));
    const rotateX = pointer.type === 'mouse' ? (0.5 - y) * 6 : 0.6 + (0.5 - y) * 4.8;
    card.style.setProperty('--rotate-x', rotateX + 'deg');
    card.style.setProperty('--rotate-y', ((x - 0.5) * 8) + 'deg');
    card.style.setProperty('--pointer-x', (x * 100) + '%');
    card.style.setProperty('--pointer-y', (y * 100) + '%');
  });
}
stage.addEventListener('pointerenter', (event) => {
  if (event.pointerType !== 'mouse' || !canAnimate('mouse') || contactId !== null) return;
  card.classList.add('is-hovered');
}, { passive: true });
stage.addEventListener('pointerdown', (event) => {
  if (!['touch', 'pen'].includes(event.pointerType) || event.isPrimary === false || !canAnimate(event.pointerType)) return;
  contactId = event.pointerId;
  card.classList.add('is-hovered');
  updateCardPointer(event);
}, { passive: true });
stage.addEventListener('pointermove', (event) => {
  if (!canAnimate(event.pointerType)) return;
  if (event.pointerType === 'mouse' ? contactId !== null : event.pointerId !== contactId) return;
  updateCardPointer(event);
}, { passive: true });
stage.addEventListener('pointerleave', (event) => {
  if (event.pointerType === 'mouse' && contactId === null) resetCard();
}, { passive: true });
// Native scrolling and pinch zoom keep ownership of the gesture. A scroll
// cancels the pointer, while window listeners also handle releases outside.
window.addEventListener('pointerup', (event) => {
  if (event.pointerId === contactId) resetCard();
}, { passive: true });
stage.addEventListener('pointercancel', resetCard, { passive: true });
window.addEventListener('blur', resetCard);
finePointer.addEventListener('change', resetCard);
reducedMotion.addEventListener('change', resetCard);

if ('IntersectionObserver' in window) {
  const links = [...document.querySelectorAll('.main-nav a')];
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      for (const link of links) {
        if (link.hash === '#' + entry.target.id) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      }
    }
  }, { rootMargin: '-10% 0px -65% 0px' });
  document.querySelectorAll('main section[id]').forEach((section) => observer.observe(section));
}

