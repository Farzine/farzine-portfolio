# Portfolio migration checkpoint

## Goal and constraints
Migrate the actual legacy portfolio to Next.js/TypeScript and Supabase with complete authorized-owner CMS coverage. Preserve its layout, content order, typography, geometry, imagery and interactions. Default dark; accessible light palette and optional lightweight Three.js enhancement. No invented claims, public drafts, secrets, pushes or deployments. One verified commit per phase on `version3`.

## Starting Git state (recorded before branch switch)
- Inspected 2026-10-15: clean `git status --short --branch` (`main...origin/main`); no pre-existing tracked or untracked changes reported.
- Initial HEAD, local main and origin/main: `6d774c7050fda2ab386fa4dfe297d4a4f4776715` (`Comment out visitor count display in site stats section`).
- Existing branches: main and version_2.0; no version3. Remote: GitHub Farzine/farzine-portfolio.
- Existing ignored/environment directories `.agents`, `.aws`, `.codex`, `.next`, `.venv`, `node_modules`, `test-results` are preserved. No package manifest present. No applicable AGENTS.md found in repository or ancestors checked so far.
- `git fetch origin` failed: `.git/FETCH_HEAD` is read-only in sandbox. Escalation needed for requested branch/commit operations. Intended base will be reverified after fetch.

## Phase status
0 passed: discovery and visual/content baseline (commit pending below). Phases 1–8 not_started.

## Decisions / implementation state
- Use actual local HTML/CSS/JS/project files as provenance; compare live site before migration. Do not replace source until baseline captured.
- Ponytail skill read; use minimal complete vertical slices, never omit required security/accessibility checks.
- Runtime available: Node v22.22.0, npm 10.9.4, Python 3.10.12. Assets approximately 22 MB. Optional browser/DB tooling discovery pending.

## Validation log
- Git inspection commands above succeeded; working tree originally clean.
- No lint/typecheck/build configured or run yet; no implementation changes yet.

## Risks/configuration
Supabase credentials and database tools not yet inspected. Never record values here. Do not infer production readiness from mocked checks.

## Ordered phases
0. Discovery, inventory, design references, architecture/plan.
1. Next.js foundation and quality tooling.
2. Supabase schema, seed, auth helpers and RLS.
3. Public migration with visual preservation.
4. Secure admin and core settings/project CMS.
5. Full CMS/media/contact.
6. Visual parity, themes and optional Three.js.
7. Caching, security and SEO.
8. Full QA, deployment docs and handoff.

## Phase 0 gate evidence and current state
- Fetch succeeded with environment permission; origin/main unchanged. Created `version3` from origin/main; confirmed current branch. Base hash remains initial hash above. No user changes touched; no push/deployment.
- Read all 16 HTML source pages, source CSS/JS, directory/asset list, README/license/CNAME and history. `version_2.0` only adds tests for unrelated interface expectations; do not merge it.
- Inventory self-check: `python3 scripts/inventory-legacy.py` passed: 16 HTML files, 102 assets, 45 known broken legacy favicon/jQuery references. Full text/links/assets/provenance: docs/legacy-inventory.json; human mapping docs/content-inventory.md.
- `PLAYWRIGHT_MODULE=file:///tmp/farzine-discovery/node_modules/playwright/index.mjs node scripts/capture-legacy.mjs` equivalent temporary capture completed in Chrome 152: local/live, desktop 1440×900/mobile 390×844, 32 screenshots, no initial broken images/uncaught JS errors; contacts width check no overflow. Seven sections' normalized text matches local/live. References docs/reference/. These are baseline observations, not full interaction/a11y/performance tests.
- `git diff --check` passed. No existing app lint/typecheck/tests/build scripts to run at Phase 0. Phase 0 docs reviewed; no UI changed.
- Current design specification and justified future changes: docs/design-preservation.md and docs/design-system.md. Plan/architecture in docs/implementation-plan.md and docs/architecture.md, with current official API references.
- Existing node_modules/.venv are incomplete environment placeholders; do not trust them. Stable registry versions checked: Next 16.4.1, React 19.3.1, Supabase SSR 0.12.7/JS 2.117.3, Three 0.186.1, Playwright 1.64.1. Docker 29.2.1 reachable with elevated access; no psql/Supabase CLI. No .env files or credentials used.
- Sandbox requires permission for Git writes, network installs, local server binds, Docker and Chrome. Standard Git fetch/npm install commands now approved; do not work around sandbox.

## Single next task
Commit verified Phase 0 using explicit docs/scripts/CONTEXT paths, record hash, then Phase 1: establish package.json, Next App Router and strict tooling, preserve legacy source/assets; run install, lint/format/typecheck/tests/build and desktop/mobile smoke.

Continue with CONTEXT.md
