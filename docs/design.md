# Personal website — current design

Updated 2026-10-03 following the owner's first-round feedback. This replaces the first Fieldnotes direction; the older documents in `superpowers/` record that initial implementation.

## Content

Exactly four sections, in order: Profile, Publications, Articles, Links. English throughout. No site brand, generic slogan, landscape illustration, project collection, or separate about section.

All unsupplied personal details remain explicit placeholders: photo, name, role, affiliation, research areas, biography, paper metadata and resources, article content, email, and profile URLs. Pending resources have no fake destination or clickable controls.

## Appearance and interaction

Graphite background with silver-gray text and small ice-blue accents. The first section is a horizontal silver-gray identification card with photo at left and biography at right. The portrait is a neutral SVG placeholder. On narrow phones, the card contents stack for readability.

The default theme follows prefers-color-scheme, including changes while the page is open and when JavaScript is disabled. Light mode uses cool gray with dark text; dark mode retains graphite, silver and ice blue. An optional System / Light / Dark selector saves manual choices locally. Saved preferences apply before the stylesheet loads. Returning to System clears the override.

The owner selected a combination of the three concepts. The silver card sits inside a translucent sleeve, with the whole assembly rotated -2 degrees (-1.25 degrees on phones). A real transparent capsule is subtracted from the plastic at its top. The woven strap extends beyond the top of the page and is held by a wide brushed metal clamp. Its broad folded tongue extends just inside the slot's upper rim, showing the thickness of its lower edge. A subtle seam and reflection give the plastic depth without obscuring text. Mobile navigation sits in two columns to leave room for the strap.

The supplied Eye of the Universe image forms a pale blue-gray watermark at the card's lower right. A CSS luminance mask removes the black background without changing the original image. Its size stays fixed at 440px × 440px across screen widths, with offsets that crop the outer rays at the card edges. The symbol uses 12% opacity at desktop width and 10% on phones. Card text and the opaque portrait remain above the decorative layer; the symbol has no pointer interaction or animation.

A translucent iridescent gradient overlays the silver card material. It displays pale violet, pink, gold, green and blue reflections. The existing pointer coordinates shift the gradient and local glare as the complete sleeve tilts; leaving the card resets the reflections smoothly. The material sits beneath text, the portrait and the Eye watermark. It has no autonomous animation, and touch or reduced-motion modes retain the static material.

Mouse hover enlarges the complete sleeve assembly to 1.025× and raises it 3px, keeping the strap and punched slot connected. Pointer position controls at most ±3° on the X axis and ±4° on the Y axis. Pointer bounds come from the stationary outer stage. Animation updates use requestAnimationFrame. Exit, pointer cancellation, and window blur reset the assembly to its resting tilt. Touch pointers and reduced-motion preferences disable the moving effect while preserving the resting tilt.

Publications and articles use text lists with clear bibliographic fields. Contact and profile URLs sit in the final links section. Navigation uses local anchors.

## Delivery

Continue using the existing dependency-free static setup and relative resource paths for GitHub Pages compatibility. Local preview only; no publication.
