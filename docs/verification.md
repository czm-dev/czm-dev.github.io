# Local verification — current revision, 2026-10-03

The original first-edition verification is preserved in verification-v1.md.

## Theme and concept update

- Light and Dark choices checked in the browser; backgrounds computed as #f2f4f7 and #101216 respectively.
- Reloading a manual Dark choice restored Dark. Returning to System removed the explicit data-theme override and matched the current dark device preference.
- Theme startup restores the stored preference before CSS loads. CSS media rules supply automatic device following; a matchMedia change listener updates theme metadata. An actual OS preference change was not separately emulated.
- Checked the Light layout at 320px: no horizontal overflow. The final combined design uses two-column mobile navigation to avoid crossing the strap.
- All three card concept pages visually inspected at 1280px. Screenshots saved to output/playwright/concept-hanging.jpg, concept-desk.jpg and concept-sleeve.jpg.
- Concept pages use a separate local server on port 4175 and are excluded from the production build.

## Combined sleeve and long strap

- Final build succeeded after the sleeve and mobile navigation changes; JavaScript syntax check passed.
- Visually checked the combined design in Light and System (currently Dark) themes at desktop width. The card and sleeve share a resting tilt; the strap reaches the page's top edge.
- Computed mask-composite is exclude: the capsule opening is transparent rather than filled with a simulated background color.
- Clicking inside the passive card activated hover and rotation; clicking outside removed the hover class and reset the properties. The animated target is the entire sleeve assembly.
- Checked 390px and 320px widths: no horizontal page overflow or internal card overflow. Final 320px navigation is clear of the strap.
- No browser warnings or errors observed. Screenshots: output/playwright/combined-badge-dark.jpg and combined-badge-light.jpg.

## Metal clasp refinement

- Replaced the direct fabric-to-slot connection with a stitched strap fold, metal D-ring, swivel collar and spring snap hook based on the supplied reference.
- Build succeeded with the new local SVG asset. The browser loaded the asset successfully at its expected intrinsic width (80px).
- Visually inspected Light and Dark desktop views and the connection detail. Checked 320px width: no horizontal page overflow or internal card overflow.
- Saved output/playwright/metal-clasp-light.jpg, metal-clasp-dark.jpg and metal-clasp-detail.png. The hardware is decorative and does not add an interactive control.

## Checks

- JavaScript syntax check passed.
- Static build succeeded after the final CSS changes.
- Existing Node tooling tests: 7 passed, 0 failed.
- Final HTML contains exactly four main sections: Profile, Publications, Articles, Links. The previous brand and generic slogans are absent.
- Final build served under /mypage/; HTML, CSS, JavaScript and favicon returned HTTP 200 with the expected MIME types.
- Browser warnings and errors: none observed after loading the working preview.

## Browser checks

- Inspected the horizontal silver profile card at desktop width and all four sections at 390px phone width.
- Checked 320px, approximately 577px, 768px and 1280px widths; no horizontal page overflow.
- Confirmed navigation anchors resolve to existing sections and clicking Links updates the location correctly.
- Moved the pointer inside the card: hover class active, X rotation 1.44 degrees, Y rotation -2.96 degrees, computed transform a matrix3d including scaling and vertical lift.
- Moved the pointer outside: hover class removed and rotation properties cleared.
- Dark-page muted text has at least 5.19:1 contrast against the brightest background stop. Small card metadata was darkened to achieve 4.98:1 against the darkest silver stop.
- Touch and reduced-motion behavior were inspected in source. These media modes were not separately emulated in the browser.

## Content and delivery

All personal details, publications, articles and URLs remain explicit placeholders. Pending URLs are text, with no fictitious or empty links. The main page now uses the owner's combined card design. Local preview only; no publication.

