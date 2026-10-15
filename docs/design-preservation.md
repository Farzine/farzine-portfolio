# Design preservation baseline

Captured 2026-10-15 from local `index.html` at `6d774c7` and https://farzine.vercel.app/. Chrome 152.0.7977.75 headless; 1440×900 desktop and 390×844 mobile. PNGs and machine-readable capture report in [reference/](reference/). All seven section text snapshots match between local and live. Font loading completed; visible images loaded in both viewports; no uncaught JS errors observed. These are baseline observations, not an accessibility/performance pass.

## Actual composition

This is a section-switching portfolio, not a long scrolling landing page. Home contains a left-aligned identity block centered vertically in a Bootstrap container: name, typed role, horizontal navigation, three circular social links, last-updated label. The profile image appears in About, **not** as a new hero illustration. Home has substantial intentional negative space and no project teasers or invented metrics.

Activating a section collapses the header to a fixed navy band, hides typing/socials, moves the name to the left and navigation to the right. One section is visible; document scrolls for long section content. Preserve hash navigation and return-to-home behavior. Resume currently uses an unnecessary `_blank` target for an internal section. Projects use All/Web/App filters and an iframe lightbox for text detail pages. Certificates have dark hover overlays, corner brackets and external-link icons. Restore equivalent keyboard and touch access.

Order: Home; About (portrait + biography/facts, then 8 interests); Education (3 image cards, then 9 certificates); Experience (4 editorial blocks, then 5 competition blocks); Projects (15 cards); Skills (4 white category panels with external logos/text); Resume (2 document cards); Contact (2×2 info boxes). No visible footer exists. No testimonials or active contact form exists.

## Source tokens and geometry

- `assets/css/style.css`: Open Sans body; Raleway section/card headings; Poppins identity, navigation and small section labels. Source font source is Google Fonts.
- Background `#010e1b`, panel/header `#09203a`, panel hover `#042e5f`, cyan `#21e5f3`, heading/line `#dee2e6`, body white, muted `#a8a9b4`. Skill panels deliberately white with navy headings, radius 8px and subtle shadow.
- Home name 48px/700/line-height 1; mobile 36px. Role 24px (20px narrow). Navigation 19px, 30px sibling gaps, margin-top 35px. Socials 40×40px, 8px gap, margin-top 40px (15px narrow).
- Compact header 90px high (60px ≤768px), identity 36px (26px narrow). Section top 70px (80px narrow); section container padding 30px.
- Bootstrap 4 grid breakpoints: 576/768/992/1200px; containers 540/720/960/1140px. At 1440px home text starts x=165; section content x=180. Gutters 30px.
- Section labels 14px/500, uppercase, 2px tracking, 120px horizontal rule; 20px bottom margin. Body 16px, usual 24px leading.
- About portrait 1/3 width desktop; biography 2/3, facts in 2 columns. Interests 4/3/1 columns with 24px row spacing; square panels, colored existing icons.
- Experience blocks navy, 40px padding, roughly 10px outer margins, 24px titles, 14px descriptions. Preserve list/bullet format, no new timeline graphic.
- Projects 3/2/1 columns, centered titles above original images, 30px card bottom gaps. Actual images retain varied crops/content; no new rounded card shell.
- Contact panels 20px padding; circular 52px icon treatments, cyan headings and left-indented text.
- Ordinary hover transitions approximately 0.3s; overlay corner motion 0.5s. Typed words: Software Engineer, AI Enthusiast. No WebGL present originally.

## Baseline bugs and permitted deviations ledger

| Change | Reason | Phase/status |
| --- | --- | --- |
| Continuous dark page background below viewport | Legacy fixed `body::before` ends after 100vh in full-page screenshots, leaving later content white with unreadable white labels | implemented, phase 3 |
| Accessible mobile nav, filter buttons, named social links and focus-visible overlays | Original icon-only controls lack accessible labels; filters are clickable list items and details depend on hover | implemented, phases 1/3 |
| Remove forced initial loader delay and unused analytics/counter calls | Loader blocks content for 1.5 seconds; invisible counter still makes requests; duplicate legacy analytics not necessary to render portfolio | implemented, phases 1/3; no replacement fake counters |
| Personal birthday/phone/precise address private by default | Explicit privacy requirement; retain exact values as editable private seed | implemented, phases 2/3 |
| Real project routes plus accessible equivalent detail dialog if feasible | Next navigation/SEO and keyboard/touch access; maintain card and detail composition | implemented, phase 3 |
| Internal Resume link uses same-tab navigation | Existing `_blank` hash link opens duplicate page | implemented, phase 3 |
| Dark/light toggle and palette translation | Explicit user requirement; preserve all component geometry | planned, phase 6 |
| Small optional Three.js enhancement within existing bounds | Explicit user requirement; no new hero/profile explorer/canvas navigation | planned, phase 6; placement chosen only after migrated comparison |
| Self-host source fonts | Preserve typography while removing runtime Google font dependence | implemented on Next home, phase 1 |

No other design deviations authorized. Record any future deviation here with evidence. Screenshots activate sections and their matching navigation state programmatically to make deterministic full-page captures; check actual menu, filters, modal and focus interactions separately in browser tests. Typing phase may differ between screenshots. Assets/background images exist but are not currently used as hero backgrounds; do not introduce them.

## Phase 1 interim boundary

Next home reproduces the source identity block; typing remains static until motion phase. Section links temporarily open `/legacy/index.html#…`, generated from untouched source with corrected asset paths, and remain functional. Mobile native details menu adds semantic/keyboard operation within original top-right placement. Full in-page section transition parity is phase 3, with theme/motion in phase 6. No claim of complete visual parity yet. Legacy preview remains noindex and must be retired before final security gate.

## Phase 3 comparison / intentional differences

Original section-switch composition, desktop/mobile container geometry, typography, source imagery/card ordering and interest/skill/experience structures are implemented through records. Desktop introduction, About and project grid were visually compared to committed reference PNGs; representative results are in [Phase 3 QA](qa/phase-3.md). Home's static first role remains until Phase 6 motion; exact final parity/theme audit remains there.

- Private fact rows are omitted on public About/Contact, preserving them in owner-editable seed. Empty collections render clear text rather than fabricated records.
- Native `<dialog>` replaces iframe lightbox/vendor JS, retaining approximately 80% desktop width / 70vh geometry; adds a real close button, Escape/focus return and canonical page link. Direct project pages add a small return link. Keyboard and no-JS links reach the same detail text.
- Filter buttons use dark text on cyan for contrast; touch targets grow to 44px on narrow screens. The All/Web/App composition stays intact.
- Certificates with empty source URLs show their titles without fake links; touch users get captions without hover. Other overlays remain focus-visible/hover-accessible.
- Safe skill-logo failure fallback shows the existing skill name. Local raster images use Next optimization/reserved dimensions, retaining originals and crops. No new imagery was introduced.
- Section/hash selection moves focus to the heading for keyboard use. Comparison captures clear focus after verification and disable transitional animation to compare resting layouts.
- Small-screen interest spacing and 992–1199px compact-header type/gaps prevent source grouping/overflow issues while retaining the same grid and header structure. CS/fact lists retain source column reading order.
- Optional nonempty footer settings render at the bottom of section content rather than covering it; original empty footer introduces no visible component. Native mobile disclosure keeps source top-right placement and supports Escape/outside dismissal with JS, direct toggling without it.
- Source external new-tab links remain where applicable; internal Resume no longer opens a duplicate tab. Normal page content never waits for a loader or animation.

No new hero, profile explorer, metric, testimonial, claim or section has been invented. Original image filenames and source dates/copy remain unchanged.

## Phase 4 admin scope

Public components/assets/layout are unchanged in this phase. New `/admin` routes use existing font/palette variables and ordinary compact lists/forms (as allowed by the admin requirements), with 44px controls, visible focus and inline states. This is separate owner editing UI, not a replacement portfolio or new public design. Private project previews reuse the migrated detail component. Remaining light-palette contrast and final public screenshot parity are still Phase 6.

## Phase 5 content and media

Public geometry, source assets, fonts, content order and default wording are unchanged. Fixed interface text now reads editable labels with identical historical defaults; owner changes are deliberate content edits. New admin collection/media forms use the established admin palette/controls. Admin-only preview covers/private galleries use a guarded proxy; large preview images and long media URLs wrap inside narrow screens. Only new raster uploads are normalized/resized for safe delivery; original repository images are untouched. Fixed section hierarchy/keys preserve composition rather than introducing a page builder.
