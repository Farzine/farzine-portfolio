# Continuation state

## Goal and constraints

Migrate the static portfolio into a strict TypeScript Next.js/Supabase profile explorer with an owner CMS. Preserve real legacy wording/dates/assets as editable drafts; invent no claims. Public reads require publication; personal facts require explicit visibility. Authorize every privileged mutation independently plus RLS. No commits, deployment, production migration or external deletion authorized.

## Phase and Git

- Phases 0–6 **passed locally**; live provider verification remains outstanding. Phase 7 **in_progress** (cache/CSP/SEO review); 8 not_started. Overall work remains incomplete.
- Branch `version_2.0`; initial HEAD `6d774c7050fda2ab386fa4dfe297d4a4f4776715`; current HEAD `c6cf8447b1ea93999a4acb881db7483d3122c17d`. Previous checkpoint committed externally between sessions; this agent made no commits.
- Initial pre-existing `.gitignore`/`Readme.md` edits, AGENTS.md and requirements-agent.txt preserved. Tree clean at this resume; current uncommitted implementation is agent work. Never reset/clean. Original HTML/assets/vendor/Readme unchanged.
- Node 22.22/npm 10.9, Chrome 152. No live Supabase credentials/project or Docker/CLI/psql. Root disk previously filled; now reports 75 GiB free (98%). `.next/cache` remains an ignored symlink to `/tmp/farzine-portfolio-webpack-cache`; do not move whole .next (breaks module resolution).

## Architecture and decisions

Next 16.4/React 19.3 App Router/server components, strict TS, npm, Biome/Prettier. CSS tokens with local DM Sans/Source Serif. Dark editorial dossier, muted mint, portrait/orbit/section markers. Direct Three.js 0.186.1 is activated only on explicit desktop interaction; static fallback otherwise. Supabase SSR 0.12.7/JS 2.117.3. Proxy refreshes admin/auth sessions with no-store/noindex; requireAdmin verifies Auth getUser plus immutable UUID allowlist, never email/user metadata. Ordinary owner writes use session credentials/RLS, not a secret key.

17 normalized public tables, grants/RLS and private is_admin helper. Migrations 001–004 execute in real embedded PostgreSQL (PGlite) with minimal platform interfaces. Import is deterministic, non-overwriting, all draft; eight facts private. Generated table/FK/RPC types checked against applied migrations.

Public DAL returns explicit Zod DTOs, plain text only. Public routes remain dynamic with path invalidation until Phase 7 tags. React.cache is request dedupe only. Narrow/cache public project/gallery queries in Phase 7. Development demo is read-only, rejects owner access/writes, omits facts, always disabled in production. Public uploads intentionally expose their URL independently of draft status; private bucket stays private. Section visibility controls homepage display; unpublish an item to withdraw API access.

## Completed paths

- `scripts/inventory.py`, data/legacy-inventory.json and content-inventory docs: all sections/15 projects/102 assets/links/source hashes; deployed homepage matched source.
- `scripts/seed.py`, seed JSON/provenance and supabase/seed.sql: original claims/date labels, 15 projects/4 experience/3 education/9 certificates/5 achievements/4 groups/36 skills/8 interests/8 private facts.
- `supabase/migrations/202610140001_portfolio.sql`, 002 media references, 003 contact intake; scripts/database*.ts and lib/types/database.generated.ts.
- Public app/page.tsx, app/projects/, site/projects components; all sections, filters/details/legacy redirects, optimized images, errors/empty states.
- `app/admin/(protected)/`, admin actions and `lib/dal/admin*.ts`: settings/projects and twelve allowlisted collections, search/order/publication/section display, private facts, skill/project/media selectors, protected previews and revision guards. Controlled forms retain errors/values and confirm dirty link/logout/reset; native destructive dialogs use exact title/revision and unique IDs.
- Media: 3 MiB PNG/JPEG/WebP/PDF uploads, private default/public opt-in, generated immutable paths. Sharp 0.35.5 decodes/strips/resizes raster to WebP. PDF format/type checks (no malware scanning). Descriptions editable; galleries relational. RESTRICT FKs guard every uploaded content reference. Metadata-first removal then Storage cleanup/restoration error handling. Private download independently authorizes with 60-second signed URL.
- Contact: optional server-only secret client in lib/dal/contact.ts calls service-only security-invoker RPC. SQL checks settings/section plus atomic 5/fingerprint/hour and 100/global/hour counters; honeypot/server validation; truthful stored-only feedback. Vercel trusted header IP HMAC; other hosts conservative shared bucket. Raw IP never stored. Owner inbox read/delete, 25-item pagination. No email notifications.
- Isolated tests snapshot sources under /tmp, no env files copied; ports 3100/3102/54399. Existing owner server on 3000 untouched. Auth/Storage HTTP simulated, actual SDK/SSR/actions and PostgreSQL policies tested.

## Exact latest verification

See docs/test-log.md for failures corrected and historical checks.

- npm run format:check; npm run lint; npm run typecheck; git diff --check: **PASS**.
- npm test: **PASS nine files**, including seven RLS subtests, contact RPC allow/deny/toggle/rate, uploads and all media FK protection; legacy hashes/selectable assets intact.
- npm run db:types and npm run db:types:check: **PASS**, migrations apply and generated types match.
- npm run build (escalated): **PASS**, public/CMS/download routes compile.
- npm run test:cms (escalated): **36 passed (3.2m)**, desktop/mobile complete CRUD/auth/privacy/media/contact regression. After final admin CSS, focused `npm run test:cms -- --grep 'uploads validate'`: **2 passed (26.1s)**; screenshots manually reviewed, no overflow.
- npm run test:e2e: **12 passed (20.9s)**. npm run test:production: **1 passed (1.2s)**, actual production ignores enabled demo flag with no credentials.
- 37 compiled client JS chunks scanned for legacy contact fields/test secret/password: **zero matches**. npm install sharp@0.35.5: observed zero vulnerabilities, package already installed.

## Remaining risks and configuration

No live Auth/Storage/PostgREST/secret-key intake verification. Repeat workflows in an authorized test project using docs/deployment.md; no live project changed. CSP/full SEO/shared-cache security and optional WebGL/performance/complete QA are unfinished. Next reports lazy project-list LCP candidate; resolve in Phase 6. Public gallery currently scans all approved media and displays at most 30 entries; narrow reads and clarify/enforce limits before final acceptance. Private previews currently cover project text/cover, not galleries. Browser back-history dirty protection is limited to browser behavior; links/reset/logout/unload are guarded. Original Readme.md and new README.md coexist; case-insensitive checkout needs a deliberate preserved archive solution before handoff.

Environment names: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, SITE_URL, PORTFOLIO_DEMO_MODE; optional server-only SUPABASE_SECRET_KEY for intake. Operator-only DATABASE_URL; test PLAYWRIGHT_CHROME_PATH. Never put values in chat/source. Non-Vercel deployment needs a trusted-proxy rate strategy before raising contact limits.

## Checklist and single next task

- [x] 0 Discovery/inventory
- [x] 1 Next/tooling
- [x] 2 Schema/import/Auth/RLS (live manual checks pending)
- [x] 3 Public migration
- [x] 4 Core CMS
- [x] 5 Full modeled CMS/media/contact (live manual checks pending)
- [x] 6 Visual refinement/lazy Three.js/static fallback and measurements (software WebGL; hardware audit pending)
- [ ] 7 Tagged caching/invalidation/security/CSP/SEO
- [ ] 8 Final QA/performance/deployment handoff

Next: implement Phase 7 stable Next fetch caching in the session-free public Supabase client with content-specific tags, updateTag after successful owner actions and narrow project/gallery reads. Keep private session/auth/contact reads no-store. Check installed docs before API use; retain dynamic SSR for nonce CSP (avoid unnecessary Cache Components conversion). Add/test nonce headers, canonical/OG/person metadata, robots/sitemap draft exclusion, action write-invalidate-read and cache/session isolation. Fix the documented gallery limit/preview and README case collision before final acceptance.

Latest Phase 6: format/lint/typecheck/nine unit files/build/type drift/diff PASS. Public suite 18 passed/2 mobile-desktop skips (24.3s), settings regression 2 passed (22.9s). Strict Mode renderer remount bug fixed via fresh scoped canvases; idle/offscreen draw and buffer cleanup observed in software WebGL. Graphics chunk measured 356436 raw/84174 gzip bytes before final lifecycle adjustment, lazy download proven. No hardware/Lighthouse score claimed.

Phase 7 in progress: stable Next fetch Data Cache is confined to session-free anonymous SELECTs with per-table/dependency tags; updateTag follows successful owner mutations. SSR/session/contact clients explicitly no-store, requireAdminPage request-only dedupe. Public shell/project/gallery queries narrowed, gallery cap removed, protected preview includes galleries. Nonce CSP forwards request headers, no auth refresh on public routes; dynamic SSR prevents shared HTML nonces. Editable favicon/social previews plus canonical/OG/JSON-LD/robots/sitemap implemented. One JSON-LD attribute has a documented narrow Biome exception with escaped-serialization tests. Public-key build/runtime guard rejects secret/service keys. SQL migrations 005/006 add SEO asset FKs, schema CREATE revocation, bucket/public consistency and registered-object immutability/deletion safety. Migration 007 adds atomic slug alias history with a transaction lock and parent-publication RLS. Types regenerated. Initial cache invalidation/isolation tests passed (two cases); metadata tests passed after canonical trailing slash normalization (two cases). Full new migration/alias regression still pending. No Phase 7 gate claimed. Next: resolve current unit results, run full CMS/public/production tests and finish cache/security/SEO review/documentation, then Phase 8 QA. All previous user work remains preserved; no live project changes.

Continue with CONTEXT.md
