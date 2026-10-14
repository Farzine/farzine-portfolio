# Continuation state

## Goal and non-negotiable constraints

Migrate this static portfolio to a strict TypeScript Next.js/Supabase profile explorer with an owner CMS. Preserve real legacy wording, dates, assets and uncertain claims as editable drafts. Never invent accomplishments. Public content requires explicit publication; private facts require explicit visibility. Guard every future admin mutation independently and with RLS. No commits, deployment, production schema changes or destructive external actions are authorized.

## Phase and repository

- Phases 0–3: **passed** (Phase 2 live-service checks remain outstanding). Phase 4: **not_started**. This is a resumable session checkpoint; the overall task is incomplete.
- Branch `version_2.0`; initial/current HEAD `6d774c7050fda2ab386fa4dfe297d4a4f4776715`. No commits made.
- Pre-existing work: modified `.gitignore`, modified `Readme.md`, untracked `AGENTS.md` and `requirements-agent.txt`. Preserved. New ignore rules were appended; original Readme edits remain untouched. New application files are untracked. Do not reset/clean them.
- Node 22.22.0/npm 10.9.4; Chrome 152.0.7977.75. No configured Supabase project/credentials. Docker socket denied; no Supabase CLI/psql available.

## Architecture and decisions

- Next 16.4.0/React 19.3.0 App Router, server components, strict TS, npm lockfile. CSS variables and local DM Sans/Source Serif fonts. Dark editorial dossier, muted mint, restrained orbit/section markers. No WebGL yet.
- Supabase SSR 0.12.7/JS 2.117.3. Separate session-free public client and cookie SSR client, `proxy.ts` refresh only on admin/auth routes with private/no-store headers. `requireAdmin` verifies Auth `getUser()` and immutable UUID membership. No service-role key.
- 17 normalized public tables with grants/RLS; `private.is_admin()` has locked search path. All imported content is draft; eight personal facts private. Real PostgreSQL policy tests use PGlite with minimal test-only Auth/Storage interfaces.
- Explicit column selections and Zod DTOs in `lib/dal/public.ts`; no private/operational fields returned. React cache deduplicates per request only. Routes are dynamic until Phase 7 tagged caching. Project helpers currently share the full homepage read; narrow/cache them in Phase 7.
- `PORTFOLIO_DEMO_MODE=true` previews preserved content only in development. Server-only guard; no writes or admin bypass; no personal facts. Production ignores it and shows an unpublished state without published settings.
- Original `index.html`, `projects/`, `assets/`, vendor files, and `Readme.md` remain unchanged. Useful image copies preserve names under `public/assets/img/`. 15 old project HTML paths and `/index.html` redirect. New README.md coexists with original Readme.md; check case-sensitive filename handling before cross-platform handoff.

## Completed paths and remaining work

- `scripts/inventory.py`, `data/legacy-inventory.json`, `docs/content-inventory.md`: all sections, 15 projects, assets/links/source hashes. Live homepage byte-identical to checkout. Inventory rerun preserves maintained migration notes.
- `scripts/seed.py`, `data/portfolio-seed.json`, `data/seed-provenance.json`, `supabase/seed.sql`: deterministic non-overwriting draft import. Hero summary is a verbatim legacy sentence; original biography/date labels retained.
- `supabase/migrations/202610140001_portfolio.sql`, `scripts/database*.ts`, `lib/types/database.generated.ts`: applied/tested schema and reproducible types with drift check.
- `app/page.tsx`, `app/projects/`, `components/site/`, `components/projects/`: all public sections, categories, details, optimized images, empty/404/error states, responsive navigation and basic metadata.
- Foundation docs, CI, env example, Biome lint/Prettier. Initial ESLint dependency chain had five unpatched high dev advisories; replacing it with Biome removed 317 packages. Last install audit: 59 packages, zero vulnerabilities.
- **Pending:** real login/logout/protected admin and CRUD; all remaining CMS/media/contact workflows; optional 3D; tagged caching/invalidation; CSP/full SEO; live auth/storage and complete QA/performance/deployment handoff. Current `/admin/login` honestly reports setup pending. No fake persistence.

## Latest exact checks and results

Full history and failure/recovery detail: `docs/test-log.md`.

- `npm run format:check`, `npm run lint`, `npm run typecheck`: PASS.
- `npm test`: PASS, five test files (legacy integrity, config, draft seed, public DTO/input safety, real PostgreSQL grants/RLS). Six RLS subtests cover anon/non-admin/admin, child visibility, meaningful media/private storage reads, and grants.
- `npm run db:types:check`: PASS against applied migrations. `python3 scripts/seed.py`: PASS, all legacy entities included; seed rerun preserves owner edits.
- `npm run build` (escalated): PASS, `/`, project list/detail dynamic; not-found/login static; proxy compiled.
- `npm run test:e2e` (escalated): PASS, **12 tests**, desktop/mobile; all 15 slugs/images, App filter, legacy redirect, privacy, 320/768/1440px overflow, keyboard/reduced motion, admin noindex/no-store, no page errors.
- `npm run test:production` (escalated): PASS, **one test**, real production server ignores deliberately enabled demo flag; no seed projects/private facts; unpublished project returns 404.
- `git diff --check`: PASS. All 16 legacy HTML hashes intact; pre-existing Readme preserved. 24 compiled client JS chunks scanned for legacy private contact fields: zero matches.
- Manually inspected decoded desktop/mobile portrait and shell screenshots in `/tmp/portfolio-portrait-*.png` and `/tmp/portfolio-public-*.png`. No performance score claimed. Lighthouse/live Supabase not tested.

## Environment risk and external verification

`/mnt/lab` filled during QA (ENOSPC), causing a build/report failure. Current filesystem still reports 100% with about 135 MiB free. Only generated `.next/cache` was moved to `/tmp/farzine-portfolio-webpack-cache` and linked back; `.next` itself/node_modules remain normal. Moving all of `.next` initially broke module resolution and was reverted. Build and complete suites then passed. No unrelated/user files removed. Free repository disk space before larger phases; recovery instructions are in `docs/deployment.md`.

Live Supabase Auth/PostgREST/Storage were not configured or tested. Embedded tests do not simulate their HTTP services. Follow test-project/bootstrap/manual policy checks in `docs/deployment.md`. No external schema changes were performed. Baseline security headers exist; CSP/cache/security review is not complete.

## Environment variable names

`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SITE_URL`, `PORTFOLIO_DEMO_MODE`; test-only `PLAYWRIGHT_CHROME_PATH`. Operator-only `DATABASE_URL` for importing SQL. Set values in ignored environment configuration, never chat/source. No runtime service-role credential currently required.

## Ordered checklist

- [x] Phase 0 repository discovery, complete inventory and plan
- [x] Phase 1 Next foundation and quality tooling
- [x] Phase 2 schema, safe draft import, SSR foundation/RLS (live manual checks outstanding)
- [x] Phase 3 public migration/responsive design
- [ ] Phase 4 secure login/logout and project/settings CMS
- [ ] Phase 5 all CMS collections, media and contact
- [ ] Phase 6 visual polish and optional lightweight Three.js
- [ ] Phase 7 cache correctness, security hardening and SEO
- [ ] Phase 8 full QA, measurements and deployment handoff

## Single next task

Start Phase 4's login/settings/projects vertical slice: read docs/implementation-plan.md and docs/security.md, check Git/disk (`git status --short`, `df -h .`), then implement protected admin routes, verified login/logout Server Actions, typed/validated privileged DAL functions and project/settings forms. Enforce `requireAdmin` independently inside every mutation. Keep absent-credentials state honest; use mocks/policy tests for local verification, document live workflows pending. Validate `npm run format:check`, `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, `npm run test:e2e`, `npm run test:production`; add direct anonymous/non-admin mutation tests.

Continue with CONTEXT.md
