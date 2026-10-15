# Portfolio migration checkpoint

## Goal / non-negotiable constraints
Migrate the actual static portfolio to Next.js/TypeScript + Supabase, with complete protected-owner CMS coverage. Preserve actual layout, typography, spacing, imagery, section order and section-switch interactions. Default dark, accessible light adaptation, small optional lazy Three.js enhancement. No invented claims, no public drafts/private values, no fake writes/delivery. Preserve user changes. One verified conventional commit per phase on `version3`. Never push/deploy or change production DB without explicit authorization.

## Git / starting state / commits
- Initially clean `main...origin/main`, HEAD/local main/origin main `6d774c7050fda2ab386fa4dfe297d4a4f4776715`. No pre-existing user changes. Existing `version_2.0` adds tests for another interface only; do not merge. Existing empty/incomplete `.agents`, `.aws`, `.codex`, `.next`, `.venv`, node_modules/test-results preserved. No applicable repository/ancestor AGENTS.md found.
- Fetched origin successfully, reverified main, created `version3` from origin/main and confirmed it before implementation. Git metadata writes require environment permission. No pushes/deployments.
- Phase 0: `7b8513f2e73e177706c2e53446da2049e643efeb` — discovery/design references/plan.
- Phase 1: `3ff00d63cf873b7cce79b2fe4e848f00c800d8e5` — Next.js foundation/tooling.
- Phase 2: gate passed; commit pending at time of writing (record hash after commit without amending it). Only migration-related changes present; original index.html/assets/projects unchanged from initial commit.

## Current phase / ordered checklist
0. **passed** — source/Git safeguards, inventory, screenshots, design/architecture/plan.
1. **passed** — Next foundation, self-hosted fonts/tokens, functioning legacy preview, tooling/CI.
2. **passed locally** — schema/seed/generated types/SSR auth foundation/RLS/Storage SQL tests. Full provider HTTP verification remains for phases 4/5/8, not claimed.
3. **not_started; next** — public DAL + complete design-preserving responsive migration.
4. not_started — login/logout, protected admin/settings/project CMS; direct-action authorization tests.
5. not_started — remaining CMS, media byte validation/reference-safe management, contact links/optional real form.
6. not_started — screenshot parity, persisted dark/light, optional lazy Three.js, measured motion/performance.
7. not_started — cache invalidation/isolation, CSP/security/SEO/secret audit.
8. not_started — full end-to-end QA, deployment/README/handoff.

## Important architecture/design decisions
- Actual site is section-switching, not a long landing page. Preserve full-height introduction; compact fixed header when a section opens; 7 primary sections; original cards/grids/white skill panels. Reference docs/design-preservation.md and docs/design-system.md; record every intentional deviation there. Dark background stopping at 100vh is a documented legacy bug to fix, not preserve.
- Source content/claims/dates are historical snapshots, never infer updates. All 16 HTML files/102 assets/links/comments inventoried in docs/legacy-inventory.json; human mapping docs/content-inventory.md. Original filenames and all 15 projects preserved, including DP-Learning's existing vdg.jpg.
- App Router Server Components, strict TypeScript, CSS variables/grid geometry, no extra styling framework. Direct Three.js only in phase 6; not installed yet. Ponytail skill read/active: smallest complete slices, never omit required security/a11y/tests. No external site-building plugin needed for this repository migration.
- Separate server-only public anonymous Supabase client and SSR session client. Auth intentionally server-managed with HTTP-only cookies, Secure in production, SameSite=Lax. No browser auth client because Server Action CMS need not read tokens. Do not introduce browser cookie-based auth without reviewing this choice. `proxy.ts` refreshes only admin/auth paths, preserves cookies/provider cache headers and forces private/no-store/noindex. `requireAdmin` independently verifies signed claims + UUID allowlist per privileged call; never shared-cache it.
- Sixteen public normalized tables + private admin_users/import_provenance. All RLS, explicit grants, fixed-search-path role predicate, no user metadata/email authorization. Public projects require published + due timestamp. Private facts invisible; groups gate skills, published projects/public assets gate gallery. Section visibility is display control; item visibility/status controls public API access.
- Seed inserts deterministic IDs with ON CONFLICT DO NOTHING, preserving owner edits. 15 draft projects, other imported collections invisible until review, personal facts private. Structural sections/navigation, source public identity/biography/media visible. Source date labels retained; separate institution fields blank where not printed. Existing legacy assets already public; new drafts use private bucket.
- No service-role key needed/used. Storage bucket metadata policies limit raster/PDF, 10 MiB, UUID paths, admin writes. Server byte validation/safe replacement still phase 5. No contact endpoint exists; editable real contact links preserve original behavior without pretending email delivery.
- Production seed fallback forbidden. `PORTFOLIO_USE_DEV_SEED=true` allowed only development/test. Public DAL in phase 3 must enforce this and map explicit public DTOs, never pass full private seed to Client Components. Shared public cache design/tag invalidation in phase 7; auth/admin/private never shared-cache.

## Implemented files / current limits
- Next foundation: app/, components/site/navigation.tsx, lib/legacy-home.ts. Root is still Phase 1 historical home snapshot; section links use `/legacy/index.html#…`. Static role until motion phase. This is **not** the completed public migration or CMS.
- `scripts/sync-legacy.mjs` preserves sources and generates ignored public/assets, public/legacy and icon on dev/build. Legacy preview retains original personal details/external scripts and accessibility issues; noindex; retire after phase 3. Do not deploy interim state as final site.
- Supabase: supabase/migrations/202610150001_portfolio.sql, seed.sql, config.toml; lib/supabase/{server,public}.ts; lib/auth/require-admin.ts; lib/security/runtime-config.ts; proxy.ts. No login/UI/mutations yet.
- Import/type tooling: scripts/import-legacy.mjs, generate-db-types.mjs, test-db.mjs; data/legacy-seed.json (server/test/tooling only); lib/types/database.ts generated by official CLI, legacy-seed-check.ts validates insert shapes. Seed includes 28 media refs, 15 projects, 9 certificates, 4 experiences, 5 achievements, 36 skills/4 groups, 8 interests, 7 private profile/contact rows, 4 social links, 2 documents, 8 nav entries, 11 sections, global settings.
- Docs: implementation-plan.md, architecture.md, content-inventory.md, design-preservation.md, design-system.md, setup.md, supabase.md, security.md, deployment.md. Readme.md points to new setup; full README handoff phase 8.

## Validation log (observed, not inferred)
- Phase 0: `python3 scripts/inventory-legacy.py` passed (16 HTML, 102 assets, 45 known legacy missing favicon/jQuery refs). Chrome 152 captures local/live desktop 1440×900/mobile 390×844: 32 PNGs in docs/reference, seven normalized section texts match, no initial broken images/uncaught errors; contacts width check no overflow. Capture script saved. Full interaction/a11y/performance reviews remain later.
- Install succeeded. Versions: Node 22.22.0/npm 10.9.4, Next 16.4.1/React 19.3.1, TS 7.0.2, Biome 2.5.15, Playwright 1.64.1, Supabase JS 2.117.3/SSR 0.12.7/CLI 2.121.0, Zod 4.6.7. Official docs checked; installed Next docs under node_modules/next/dist/docs. Initial unsupported Fontsource import paths and lint errors fixed without disabling rules.
- Final Phase 2: `npm run lint`, `npm run format:check`, `npm run typecheck` (next typegen + strict tsc), `npm run build` passed (static / and /_not-found, Proxy). Source unchanged check `git diff --quiet 6d774c7 -- index.html assets projects` exited 0.
- `npm test` **outside sandbox** passed 5 named assertions (source home, source seed preservation, production seed guard, public-key/URL guard, repeatable legacy preview). Sandbox IPC restriction originally caused file-only summaries; elevated rerun confirmed actual named tests execute. Always use host permission for tsx tests/browser/Docker here; do not mistake file-only summaries for assertions.
- `CHROME_PATH=/usr/bin/google-chrome npm run test:e2e` final post-build run passed 6/6 in 3.6s. Desktop/mobile home/dark/legacy About/image/width/no uncaught errors, real 404 recovery, no-JS mobile menu. Only NO_COLOR/FORCE_COLOR tool warnings. Screenshots in ignored test-results; no full parity/performance claim.
- `CHROME_PATH=/usr/bin/google-chrome node scripts/import-legacy.mjs` passed; scripts disabled, external HTTP aborted. `npm run test:db` passed against fresh disposable PostgreSQL 17-alpine: actual anon/non-admin/admin SQL, self-promotion denial, draft/archive/scheduled/private filtering, Storage role/path tests, URL/slug/null-media constraints, repeatability and owner edits surviving reseed. **Minimal auth/storage schema fixtures, not real provider HTTP services.**
- `PORTFOLIO_TYPES_DB_URL=<local test URL> npm run db:types` passed using official Supabase CLI against migrated schema; safe script preserves prior types on failure. Initial CLI TLS failure fixed with sslmode=disable only for loopback disposable container, not hosted configuration.
- `git diff --check` passed. Reviewed changes for unrelated files, destructive edits, unsafe grants and credentials. Selected private seed/test/admin identifiers absent from .next/static client JS; no real credentials used. Exhaustive history/chunk audit still phase 7.

## Environment / operational state
- Required runtime names only: NEXT_PUBLIC_SITE_URL, NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY. Development flag PORTFOLIO_USE_DEV_SEED. Tooling-only PORTFOLIO_TYPES_DB_URL. No real .env/configured hosted project used; never print or commit values.
- Isolated Docker container `farzine-portfolio-phase2-db` is running on loopback port 54329, public test fixture password documented in docs/supabase.md; no owner data. Created/refreshed only this session's test container. Stop only this container with `docker stop farzine-portfolio-phase2-db` when finished. Full local Supabase stack not started; provider login/refresh/logout/Data API/Storage HTTP remain to test in later phases.
- Legacy Python server may still run on 4173 (tool session 9701); no persistent Next server (Playwright owns/stops it). Temporary tooling in /tmp/farzine-discovery is not required after npm install.
- Sandbox requires elevated permission for Git writes, network installs, localhost binds, Chrome, tsx IPC and Docker. Existing permissions cover common commands; no bypasses. No owner decision/credential blocks Phase 3.

## Single next task
Finish Phase 2 final E2E/commit and record hash if not already recorded. Then Phase 3: read plan/design docs and Git status; implement typed server-only public DAL + explicit development-only seed DTO adapter, migrate all source sections and stable project routes, replace temporary legacy navigation, preserve original section-switch composition and remove served legacy preview once equivalent content works. Add unknown/draft 404, privacy/published filtering, image/link mapping and desktop/tablet/mobile/keyboard/no-JS/reduced-motion tests. Production build must not silently use seed. Validate npm lint/format/typecheck/test/build plus appropriate database/browser gates before one Phase 3 commit.

Continue with CONTEXT.md
