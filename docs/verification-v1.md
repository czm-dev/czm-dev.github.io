# Local verification — 2026-10-03

## Automated checks

- `npm test`: 7 passed, 0 failed. Covers public resources, MIME types, private-path exclusion, traversal, repository subpaths, build contents, and symbolic-link boundaries.
- `npm run build`: succeeded. Output in `dist/` includes only the public site files.
- `node --check app.js`, `scripts/serve.mjs`, and `scripts/build.mjs`: passed.
- Served the final build under `/mypage/`. The HTML and every referenced CSS, JavaScript, favicon, and illustration resource returned HTTP 200 with the expected content type.

## Browser review

- Inspected desktop and mobile rendering in the Codex browser.
- Checked 320px, 390px, 768px, 1280px, and 1440px widths; no horizontal page overflow observed.
- All three illustrations loaded. No browser warning or error logs were reported.
- Each note category showed one matching entry; All notes restored all three. Selected-button state and the live result announcement updated correctly.
- Opened a note and a project preview. Verified initial close-button focus, Escape dismissal, return of focus to the opening button, and removal of the scroll lock.
- Verified the mobile project dialog had no horizontal overflow.
- Independent source review approved the requirement coverage and implementation after two label contrast fixes. Final contrast: 5.46:1 for placeholder labels, 4.93:1 for project tags.
- Reduced-motion rules and no-JavaScript content visibility were inspected in source; these modes were not separately emulated in the browser.

## Result and boundaries

English first edition with explicit personal-content placeholders. No real project, article, biography, or contact details have been supplied. Contact is intentionally plain placeholder text. No publication, remote repository change, or automatic deployment workflow was created.

The preview screenshot is saved at `output/playwright/desktop-preview.jpg`. Source edit instructions and local commands are in `README.md`.
