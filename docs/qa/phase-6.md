# Phase 6 visual preservation, themes and progressive graphics evidence

2026-10-15; Linux, Node 22.22.0, Next 16.4.1/React 19.3.1, Chrome 152/Playwright 1.64.1. Owned local Supabase and app port 3102, never a hosted project. The unknown development server on 3000 was left untouched.

| Command/check | Observed result |
| --- | --- |
| `npm view three version`, matching declarations | Stable 0.186.1; @types/three 0.186.0 |
| `npm install --save-exact three@0.186.1`; matching dev declarations | Succeeded, audited 74 packages, zero reported vulnerabilities |
| `npx supabase migration up --local` | Additive migration 005 applied without reset |
| `PORTFOLIO_TYPES_DB_URL=<loopback tooling URL> npm run db:types` | Official types regenerated; public columns/types unchanged |
| `npm run test:db` | Passed, existing role/seed/Storage/concurrency regressions plus 20 fixed labels |
| `npm run lint`, `npm run format:check` | Passed, 99 files; final lint has no diagnostics |
| `npm run typecheck` | Passed, strict types and generated route types |
| `npm test` with host IPC permission | 17 named tests passed; includes pre-paint storage behavior and both implemented palettes' AA text/control contrast |
| `npm run build:local` | Passed after final source-spacing corrections; dynamic public/admin routes, static not-found, Proxy |
| `CHROME_PATH=/usr/bin/google-chrome npm run test:e2e:local` | Final implementation: 45 public checks passed (23.6s), seven actual admin workflows passed (15.2s), 52 total |
| `CHROME_PATH=/usr/bin/google-chrome node scripts/with-local-supabase.mjs test:e2e:motion` | Final focused hardware-aware tests: 18/18 passed (15.6s); only subsequent change removes an unused test parameter |
| `npm run test:production-boundary` | Passed on final build; production seed rejected with HTTP 500, safe recovery and no seed/private output |
| Final client-output scan | 16 JS chunks; no local operator keys, fixture passwords, private canary or seed provenance |
| `git diff --quiet 6d774c7 -- index.html assets projects`, `git diff --check` | Passed; original source/assets retained |

## Visual comparison

Unedited desktop/mobile captures in [phase-6/](phase-6/) include both palettes, home, About, project grid, original white skill panels and actual WebGL hover. Tablet and additional sections were tested/captured in ignored test-results. Both themes retain identical measured identity geometry and no horizontal overflow; 320px home/skills also pass. First skill-panel coordinates match the original: desktop x190/y129/width1080, mobile x40/y163/width330. Final review restored panel margins/padding, list columns and chevrons from source. Original claims, dates, image files/order and section-switch composition remain.

[Measured source crops and final graphics chunk](phase-6/design-bundle-measurements.json) compare raw pixels from the original desktop home and the actual new dark capture: identity and navigation mean absolute channel error **0**; social/date crop **0.0055 / 255**. The role varies by typing phase and the new fixed theme control is intentionally excluded. This is evidence for those crops, not a whole-page pixel-perfect claim. Privacy omission, continuous background, keyboard/dialog improvements and other deliberate differences are in [the preservation ledger](../design-preservation.md).

Slow external skill logos previously left blank slots. Existing names now occupy those same reserved slots while pending or failed; original images replace them when available. Forced stalled/failed request tests pass at all three viewports. Source URLs remain intact, SSR/no-JS retains native image/alt output, and no new claim or image was invented.

## Themes, motion and resource checks

Dark remains the first-visit default even with a light OS preference. Keyboard Space toggles the named aria-pressed control; explicit choice survives reload. Blocking all Next hydration scripts still applies saved light mode from the fixed head script before paint. Denied storage preserves a functioning page and permits switching in memory. No hydration/page/console errors occurred in normal theme tests. Root-only hydration suppression is documented; CMS values never enter executable script text.

Both actual palettes meet ≥4.5:1 for tested normal-text pairs (text/headings/accent/muted/errors on background/panel/hover, inverse accent buttons); source white skill-panel text remains high contrast. This is not an exhaustive accessibility audit. Source role cycling has static accessible text and first-role no-JS/reduced-motion output; reduced-motion change stops typing. Intersection/visibility handlers stop hidden work. Section entry is a finite 180ms opacity effect; no blocking intro.

The browser supports WebGL2 under the actual fail-if-major-caveat setting (24 reported cores). Desktop tests observe real draw calls, one canvas, capped pixel ratio, no additional draws after settling, repeated focus interactions, buffer/program deletion and lost/disposed contexts. Offscreen section navigation and reduced-motion changes remove the enhancement. Unsupported WebGL retains original CSS brackets/dialog links. Mobile/tablet/reduced-motion visits make no Three.js engine request. CI tests choose the intended fallback on low-core/low-memory or unavailable-GPU workers; no test is skipped to claim rendering there.

The engine chunk is about 533 kB raw / 131 kB local gzip, deferred until deliberate qualifying desktop hover/focus. It is absent from observed initial network requests. The one scene draws eight bracket triangles with one draw call, no textures/lights/shadows/postprocessing and no continuous idle RAF. Slow sustained intervals dispose it; hidden tabs, offscreen, unmount, blur/leave and preference changes release resources. Static/CSS/links remain independent.

[Local navigation samples](phase-6/local-navigation-measurements.json) are one unthrottled cold browser context per viewport against loopback production Next/Supabase, sampled before final non-layout logo fallback and skill-spacing corrections: desktop FCP/LCP 196ms, CLS 0; mobile 60ms, CLS 0.000629; ten initial JS requests totaling 154,097 encoded bytes, excluding the Three engine. They are **not** Lighthouse, field CWV, physical mid-range-phone or final production scores. Hosted latency/CDN and hardware profiling remain Phase 8.

Initial check failures were fixed/recorded before the gate: label-count assertion updated for the two new rows; strict target nullability; a test needed a new focus after preference reset, then two rendering frames for the actual media-query event. One Chrome screenshot protocol failure disappeared on rerun without loosening assertions. Final standalone full regression and focused hardware-aware suite passed; no rules/checks were disabled. Avoid concurrent browser benchmarks when profiling shared GPU resources.

## Remaining scope

Phase 7: content-specific shared caching/immediate publish withdrawal, invalidation/private isolation, CSP including fixed theme script/dynamic chunks, security/history/secret audit and SEO. Phase 8: comprehensive a11y/performance/hosted configuration/deployment handoff. No physical phone, hosted Auth/Storage/CDN/SMTP, metadata-registration outage injection or full memory profiler was used. Unsaved client-history navigation remains a documented admin limit. No push, deployment or production database mutation occurred.

Official API references checked: [Three WebGLRenderer](https://threejs.org/docs/pages/WebGLRenderer.html) (WebGL2, dispose, forceContextLoss), [React hydration](https://react.dev/reference/react-dom/client/hydrateRoot), and installed Next 16 lazy-loading/Script documentation. Direct event-time import uses a Client Component boundary; no R3F/Drei framework is needed for one small enhancement.
