import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { createSiteServer } from './site.mjs';

// Separate local mockups: they are excluded from the public build.
const workspace = fileURLToPath(new URL('../', import.meta.url));
const root = fileURLToPath(new URL('../output/card-concepts/', import.meta.url));
await mkdir(`${root}/assets`, { recursive: true });
let html = await readFile(`${workspace}/index.html`, 'utf8');
html = html.replace(/    <script>[^]*?<\/script>/, '')
  .replace('<html lang="en">', '<html lang="en" data-theme="dark">')
  .replace(/        <label class="theme-control">[^]*?<\/label>/, '')
  .replace('<link rel="stylesheet" href="./styles.css">', '<link rel="stylesheet" href="./styles.css"><link rel="stylesheet" href="./assets/concepts.css">')
  .replace('<section class="profile-section"', '<p class="concept-caption" id="concept-caption"></p><section class="profile-section"');
await writeFile(`${root}/index.html`, html);
await copyFile(`${workspace}/styles.css`, `${root}/styles.css`);
await copyFile(`${workspace}/assets/favicon.svg`, `${root}/assets/favicon.svg`);
await writeFile(`${root}/.nojekyll`, '');
const app = await readFile(`${workspace}/app.js`, 'utf8');
await writeFile(`${root}/app.js`, `
const concepts = { hanging: '01 / Hanging badge', desk: '02 / Desk card', sleeve: '03 / Clear sleeve' };
const concept = new URLSearchParams(location.search).get('concept');
document.body.dataset.concept = Object.hasOwn(concepts, concept) ? concept : 'hanging';
document.querySelector('#concept-caption').textContent = concepts[document.body.dataset.concept];
${app.slice(app.indexOf("const stage ="))}`);
await writeFile(`${root}/assets/concepts.css`, `
.concept-caption { font-family: var(--mono); font-size: 12px; letter-spacing: .6px; color: var(--accent); margin-top: 10px; }
.profile-section { padding: 28px 38px 92px; }
.card-stage { position: relative; max-width: 850px; }
.profile-card { --rest-angle: 0deg; transform: rotateZ(var(--rest-angle)) rotateX(var(--rotate-x)) rotateY(var(--rotate-y)); }
.profile-card.is-hovered { transform: translateY(-4px) rotateZ(var(--rest-angle)) rotateX(var(--rotate-x)) rotateY(var(--rotate-y)) scale(1.025); }
/* Short fabric tab and restrained metal clasp. */
[data-concept="hanging"] .card-stage { padding-top: 69px; }
[data-concept="hanging"] .card-stage::before { content: ''; position: absolute; top: 0; left: calc(50% - 12px); width: 24px; height: 75px; background: repeating-linear-gradient(90deg, #516476 0 2px, #45596d 2px 3px); border: 1px solid #718497; border-radius: 3px; box-shadow: 4px 8px 12px #0004; }
[data-concept="hanging"] .profile-card { --rest-angle: -1.2deg; transform-origin: 50% 0; }
[data-concept="hanging"] .profile-card::after { content: ''; position: absolute; z-index: 3; top: -25px; left: calc(50% - 17px); width: 34px; height: 35px; border: 1px solid #a2b0bc; border-radius: 5px 5px 9px 9px; background: linear-gradient(90deg, #7d8c9c, #e6edf3 34%, #a8b4c0 70%, #667787); box-shadow: 1px 5px 5px #202c3a40, inset 0 -6px 0 #738395; }
[data-concept="hanging"] .card-heading { padding-top: 6px; }
/* Offset placement and a deeper directional shadow suggest a card put down by hand. */
[data-concept="desk"] .profile-section { padding-top: 73px; padding-bottom: 110px; }
[data-concept="desk"] .card-stage { transform: translateX(14px); }
[data-concept="desk"] .profile-card { --rest-angle: -2.3deg; box-shadow: 18px 30px 45px #0006, 0 2px 3px #fff3 inset; }
[data-concept="desk"] .card-stage::after { content: ''; position: absolute; z-index: -1; left: 6%; right: 6%; bottom: -32px; height: 1px; background: linear-gradient(90deg, transparent, #64718255, transparent); }
/* Transparent sleeve, welded edges, and a small opening above the silver insert. */
[data-concept="sleeve"] .profile-section { padding-top: 53px; }
[data-concept="sleeve"] .card-stage { padding: 27px 16px 20px; border: 1px solid #8297aa6b; border-radius: 21px; background: linear-gradient(145deg, #aacbe51c, #5a728410 60%, #d8eafa24); box-shadow: 0 28px 55px #0004, inset 0 0 0 5px #b4d0e70a; }
[data-concept="sleeve"] .card-stage::before { content: ''; position: absolute; top: 10px; left: calc(50% - 34px); width: 68px; height: 6px; border-radius: 6px; background: #0e1720; box-shadow: 0 1px 0 #bbd4e650; }
[data-concept="sleeve"] .card-stage::after { content: ''; pointer-events: none; position: absolute; z-index: 3; inset: 8px; border: 1px solid #c5deef30; border-radius: 15px; background: linear-gradient(116deg, transparent 58%, #eef8ff10 59%, transparent 75%); box-shadow: inset 0 -11px 15px #a3c0d012; }
[data-concept="sleeve"] .profile-card { border-radius: 12px; box-shadow: 0 4px 8px #0003; }
[data-concept="sleeve"] .profile-card.is-hovered { transform: translateY(-8px) rotateX(var(--rotate-x)) rotateY(var(--rotate-y)) scale(1.015); }
@media(max-width:600px) { .profile-section { padding-left: 8px; padding-right: 8px; } [data-concept="desk"] .card-stage { transform: none; } [data-concept="sleeve"] .card-stage { padding-left: 8px; padding-right: 8px; } }
@media(prefers-reduced-motion:reduce) { .profile-card { transform: none !important; } }
`);
const server = createSiteServer({ root });
server.listen(4175, '127.0.0.1', () => console.log('Card concepts: http://127.0.0.1:4175/?concept=hanging'));
