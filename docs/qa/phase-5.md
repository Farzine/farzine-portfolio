# Phase 5 complete CMS and media evidence

2026-10-15; Node 22.22.0, Next 16.4.1/React 19.3.1, Chrome 152/Playwright 1.64.1, Linux. Full isolated Supabase Auth/API/Storage stack; separate disposable PostgreSQL policy harness. No hosted project, real email, push or deployment.

| Command/check | Observed result |
| --- | --- |
| `npm install --save-exact sharp@0.35.5` | Succeeded; audited 66 packages, zero reported vulnerabilities |
| `npx supabase migration up --local` | Migrations 002–004 applied successfully without reset |
| `PORTFOLIO_TYPES_DB_URL=<local test URL> npm run db:types` | Official CLI types regenerated successfully from migrated schema |
| `npm run lint` | Passed, 91 files, no diagnostics |
| `npm run format:check` | Passed, 91 files |
| `npm run typecheck` | Passed, generated route types + strict tsc |
| `npm test` with host IPC permission | 15 named tests passed |
| `npm run test:db` | Passed; RLS/grants/constraints/seed regressions and both real concurrent reference/delete lock orders |
| `npm run build:local` | Passed on final implementation; public/admin routes dynamic, static not-found, Proxy |
| `CHROME_PATH=/usr/bin/google-chrome npm run test:e2e:local` | 27 public checks passed (11.6s), then seven real admin workflows passed (15.8s): 34 total |
| `npm run test:production-boundary` | Passed; production seed flag returns HTTP 500 with safe recovery and no private/seed output |
| Client-output scan | 17 JS chunks contained no local operator keys, Auth fixture credentials, private canary or seed provenance |
| `git diff --quiet 6d774c7 -- index.html assets projects` | Exit 0; original source/assets unchanged |
| `git diff --check` | Passed |

Browser tests create/edit/show/hide/order/delete ten entity types with actual anonymous API/public HTML checks and anonymous/non-admin action replays. They edit section title/visibility/order, navigation including create/delete, fixed public display labels, and reject unsafe URLs. Source fixtures are restored in cleanup. Existing settings/projects/gallery/login/logout/refresh/stale-write workflows remain in the full regression.

Media tests exercise actual decoded raster upload, spoof rejection, anonymous/non-admin upload/download denial, private cover/gallery previews, explicit public-copy creation and public byte reads, description edits, foreign-origin rejection, referenced deletion failure followed by successful Storage/metadata cleanup, private PDF attachment headers/bytes, and retry of a staged tombstone. Unit tests exercise decoded dimensions/resize/metadata stripping, bounded size, invalid types/extensions/bytes, origin handling and structured collection schemas. SQL tests also cover pending-asset privacy, immutable metadata/objects, blocked references/tombstone reversal/untracked deletion and label grants.

Two independent database sessions prove both concurrent orders: a committed reference blocks a waiting tombstone; a committed tombstone blocks a waiting reference. The volatile reference predicate fixes stale snapshots after lock waits. No disabled rules, skipped security tests or fake writes.

The [mobile media capture](phase-5/admin-mobile-media.png) is an actual settled 390×844 form, visually inspected with no horizontal overflow. The earlier Phase 4 mobile loading capture was corrected with a settled-control/font wait and carried into this commit without rewriting Phase 4. Public geometry/styles and source copy defaults remain unchanged; the new editable labels preserve identical wording.

Limits: hosted Storage/CDN/Auth/SMTP and proxy headers have not been verified. Metadata-registration/outage orphan recovery is documented but not fault-injected. PDF checks are bounded format checks, not sanitization. Unsaved prompts cover links/unload; client-history Back/Forward remains a documented limitation. Contact remains editable real links without a form or delivery claim. Exact parity/light theme/WebGL/performance are Phase 6; shared cache/CSP/full security/SEO audit Phase 7; final deployment/handoff Phase 8. No Lighthouse/Core Web Vitals score is claimed.
