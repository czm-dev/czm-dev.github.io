# Fieldnotes — first preview

Historical first version. The current requirements and design are recorded in `../../design.md`.

## User decisions
- Create a personal homepage in the current workspace. Local preview only; eventual hosting is GitHub Pages.
- English throughout the website. Communicate with the owner in Chinese.
- Give work and journal entries equal emphasis, alongside an introduction, about section, and contact area.
- Mark all missing personal information explicitly. Never imply sample projects or writing are the owner's real work.

## Design
An explorer's private journal. A warm paper surface, ink-green typography, restrained terracotta accents, large serif headlines and quiet sans-serif body copy. Spatial depth and ample negative space echo Interstellar; warm landscape forms echo Outer Wilds; asymmetric composition and changes of typographic rhythm echo Samurai Champloo. No character artwork or spacecraft instrument panels.

Use a single editorial page: wordmark and navigation; spacious introduction and original abstract landscape; two work placeholders; three filterable note previews; about and current interests placeholders; contact placeholder and footer. Primary links scroll to work and notes. Work and note previews open an accessible dialog and explicitly identify themselves as templates. Filters show matching notes. Contact is honest static text until a real address exists.

Artwork is native SVG, with no external resources. Fonts use local system serif/sans-serif stacks. Subtle hover transitions and an entrance animation respect reduced-motion preferences. All content remains visible with JavaScript disabled; enhanced-only controls are hidden until initialized.

## Architecture and acceptance
Dependency-free HTML, CSS and browser JavaScript. Relative asset URLs work at both domain root and a GitHub Pages repository subpath. A small Node development server binds to localhost; a build script assembles dist without publishing. No remote repository changes or deployment configuration that can publish automatically.

Acceptance: coherent desktop and mobile layouts, English labels, clearly marked personal placeholders, functioning navigation/filter/dialog interactions, keyboard support, reduced motion, no missing local resources, and a successful static build. Review source independently and inspect rendered browser output before handoff.
