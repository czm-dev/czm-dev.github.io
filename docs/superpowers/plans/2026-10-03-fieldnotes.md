# Fieldnotes Implementation Plan

> **For agentic workers:** Use superpowers:subagent-driven-development for independent work, followed by review and local verification.

**Goal:** Deliver an English personal homepage with a working local preview, ready for later GitHub Pages hosting.

**Architecture:** Static semantic HTML with CSS tokens and progressive JavaScript enhancements. Original SVG illustrations are local assets. Dependency-free Node scripts serve and package the website.

**Tech Stack:** HTML, CSS, JavaScript, SVG, Node.js built-ins.

## Chunk 1: Site and local preview

- [x] Create index.html with header, introduction, work, notes, about, contact, and accessible preview dialog. Mark identity, work, writing, interests, and contact details as placeholders.
- [x] Create styles.css with warm paper, serif headings, dark green ink, terracotta accents, responsive layouts, focus states, and reduced-motion behavior.
- [x] Create app.js for note filters, preview dialogs, and optional navigation state. Keep content usable without JavaScript.
- [x] Delegate assets/horizon.svg, assets/contours.svg, and assets/orbits.svg as original abstract editorial illustrations.
- [x] Delegate package.json, scripts, README.md, .nojekyll, and .gitignore. Commands: npm run dev; npm run build; npm test. No deployment.
- [x] Start localhost preview after the coherent page exists and open it in Codex.

## Chunk 2: Verification and delivery

- [x] Independently review implementation against the user's visual and content constraints and review accessibility/code quality.
- [x] Inspect desktop and narrow layouts and exercise navigation, filters, preview dialog, Escape, and focus restoration.
- [x] Run the build and verify relative resources under a repository subpath, with no missing files.
- [x] Keep the local preview available, document edit points, and hand off the preview URL. Do not publish.

