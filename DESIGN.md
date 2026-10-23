# Taste Skill redesign

## Direction

**The split stage**, seed **56501516**, from [Taste Skill](https://github.com/Leonxlnx/taste-skill/tree/6010f91a9935f1c167dfc500fb1a475681892e6b/skills/taste-skill). No random redraws. The paper/ink palette proportions are retained, with the teal mapped to the blue-grey of orbital imagery and an accompanying dark theme. The serif/sans pairing is Gambarino / General Sans.

The idea: Zhimin’s interest in computing constellations becomes an orbital view beside a readable academic profile. The interactive element is a four-image selector; desktop chapter navigation also changes the image. The original lanyard tilt is retired as part of the redesign. The theme preference, named sections, anchor navigation and existing public profile facts are retained.

No portrait, publication, article, affiliation beyond USTC, award or achievement has been invented. Publications and articles remain as honest empty states. The missing Scholar and ORCID destinations are not rendered as fake links. Existing artwork files remain in the repository.

## Verification

- Project test suite: **23 passed**. Existing theme and build/deployment-tooling coverage retained; retired lanyard behavior tests replaced with image-selector, reduced-motion, phone-layout and section-navigation regression cases.
- Static build: successful.
- Taste source lint: before **39 FAIL / 8 WARN**, after **0 FAIL / 0 WARN**.
- Cloud-browser visual review: original homepage, new light/dark desktop and phone views, research, empty writing sections, contact and footer. Responsive iframe layouts checked at 320, 390, 768 and 1440 CSS pixels. Each had `scrollWidth === clientWidth`. These were real browser document viewports inside frames, not physical-device emulation.
- Confirmed rendered headings fit within two lines, images load, theme cycles, gallery selection updates image/caption/pressed state, and anchor navigation reaches the corresponding sections.
- Browser review used the supported cloud browser because the browser extension did not respond. Taste's Chromium-based `inspect.mjs` could not run: no Chrome executable is installed. No automated inspector pass or complete automated accessibility audit is claimed. Reduced-motion logic has automated regression coverage; its CSS removes transitions and animations.

## Visual critique

ROUND 1

Seen in one second: the name beside a view of Earth from orbit.

Idea: the research subject becomes a persistent orbital image while the academic profile stays readable.

Live thing: image selection, with optional chapter-driven crossfades on desktop.

Layout words by section: hero=split / research=filled reading column / writing=compact list / contact=full-width two-column close / footer=large name.

Scores (self-assessment, not an external jury): design 7.5 · usability 8.2 · creativity 7.0 · content 7.2 → overall 7.6.

Caps applied: creativity limited to 7 because orbital imagery can also suit another satellite-network researcher. The exact automated inspector result remains unverified.

Top three problems, most visible first:

1. Mobile headline loses its word break if the desktop line break is hidden. Fixed by retaining the two-line name; verified at 320, 390 and 768.
2. A narrow sliver of imagery separates the desktop caption and controls. Fixed by aligning the caption to the control strip height.
3. Publications and articles have no supplied entries. Kept as compact, honest empty states rather than making up proof; real work will make the page more individual.

ROUND 2

Seen in one second: Zhimin Chen and an orbital view; the first screen states his role and research interest with a working email action.

Idea: a calm academic profile alongside changing views from orbit.

Live thing: keyboard- and touch-operable image selector.

Layout words by section: hero=split / research=filled reading column / writing=compact list / contact=full-width close / footer=large name.

Scores (self-assessment): design 7.5 · usability 8.2 · creativity 7.0 · content 7.2 → overall 7.6.

Caps applied: the subject-specificity limit above; automated Chromium inspection remains unavailable.

Remaining limitations:

1. Research output is not yet supplied; empty sections are intentional.
2. The imagery shows the research domain rather than original project results. Replace it with real constellation visualizations or research outputs when available.
3. Fontshare is an external dependency. Georgia and Arial keep the page readable if its fonts fail to load.

## Images

All four images are downloaded assets, public domain, with a visible **Image credits** disclosure in the footer. No bundled stock portraits, generated photographs or substitute drawings are used.

- [Earth and International Space Station](https://commons.wikimedia.org/wiki/File:Earth_and_international_space_station.jpg), NASA / pingnews.com.
- [Earth’s horizon and solar arrays](https://commons.wikimedia.org/wiki/File:Earth_horizon_and_International_Space_Station_solar_panel_array_(Expedition_17_crew,_August_2008).jpg), NASA.
- [Etna eruption from the ISS](https://commons.wikimedia.org/wiki/File:Etna_eruption_seen_from_the_International_Space_Station.jpg), NASA.
- [ISS star trails](https://commons.wikimedia.org/wiki/File:International_Space_Station_star_trails_-_JSC2012E039800.jpg), NASA / Don Pettit.

Full metadata and source image URLs: `assets/credits.json`.
