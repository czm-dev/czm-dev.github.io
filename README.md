# Zhimin Chen — personal website

A static academic profile for Zhimin Chen, a postgraduate student at USTC researching routing and networking in computing constellations.

The Taste Skill redesign uses a split layout: a sticky orbital photo gallery and a readable profile column. On phones, the introduction precedes the inline gallery. Light, dark, and system themes persist across visits. Image controls work with touch and keyboard, automatic scene changes are desktop-only, and animations respect reduced-motion preferences. Core content and email links work without JavaScript.

## Development

Node.js 20 or newer, with no npm dependencies.

```sh
npm run dev
npm test
npm run build
npm run preview
```

The output is `dist/`. GitHub Actions tests and builds pushes to `main`, then deploys to GitHub Pages.

## Content

Update the profile, publications, articles, and contact links in `index.html`. Publications and articles currently have honest empty states: add only verified records and working destinations. Do not publish placeholder academic credentials or research results.

## Credits

The four orbital images are NASA public-domain images, downloaded from Wikimedia Commons. Full source URLs and attribution metadata are in `assets/credits.json`; visitors can open **Image credits** in the footer. Gambarino and General Sans are served by Fontshare, with local system fallbacks if the service is unavailable.

Design direction: Taste Skill “The split stage”, seed `56501516`, source revision `6010f91a9935f1c167dfc500fb1a475681892e6b`. The generated teal palette was mapped to the existing blue-grey cosmic character, with a dark counterpart. Existing lanyard/placeholder components were replaced; no framework migration was introduced.
