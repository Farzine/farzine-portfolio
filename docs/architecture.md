# Architecture and decisions

## Baseline and target

Static source: 124 tracked files, no package/build/deployment config; `CNAME` contains the legacy custom-domain hint and README points at Vercel. Source remains untouched during foundation. Branch `version_2.0` adds tests for a different interface without corresponding implementation on main; do not merge it or copy its expectations. Node 22.22.0/npm 10.9.4 available. Existing `node_modules` directories are incomplete placeholders (no usable manifests), not installed dependencies.

Use current stable Next App Router, React, strict TypeScript, npm lockfile. CSS variables + preserved Bootstrap geometry, no Tailwind/second styling system. Direct Three.js later for one optional effect; do not install a scene framework now. Server Components render public content; small Client Components handle section selection, filters, theme, forms and lazy canvas. No browser DB access for public content required.

## Planned routes and boundaries

- `/`: source section-switch portfolio with addressable hashes and server-rendered content accessible without JS.
- `/projects`: canonical project listing, matching original cards.
- `/projects/[slug]`: published detail, genuine 404 for private/unknown slug; old `/projects/*.html` mapped to stable slugs.
- `/admin/login`, `/admin` and focused collection/settings/media editing routes. No public registration. Admin/login noindex; private responses dynamic/no-store.
- Server Actions for validated CMS mutations; upload handler only where FormData upload processing needs it. No generic unrestricted CRUD API.
- `lib/dal/` owns narrow typed public reads and authorized writes, marked server-only. Components receive explicit public DTOs. Auth verification is never shared-cache data.
- `lib/supabase/` holds separate anonymous public and session SSR helpers. `proxy.ts` refreshes auth cookies on admin/auth paths only; every action and privileged DAL operation separately calls `requireAdmin`.

## Planned data model

Use normalized entities for site settings, section settings, profile facts (explicit visibility), projects, project media, experience, education, certifications, achievements, skill groups/skills, interests, social links/navigation/document links, media metadata, and admin allowlist. Arrays appropriate for a project's tech tags and paragraph/bullet text; no unrestricted whole-site JSON blob or executable HTML. Private provenance/admin notes never appear in public DTOs. Singleton identity/settings with explicit public contact choices; private fields in separate rows/table where row policies can protect them.

Common UUID identity, created/updated timestamps, stable order and visibility; projects additionally unique slug, draft/published/archived and publication timestamp. Preserve source date labels rather than invent exact dates. Foreign keys protect referenced media; deletion checks all references. Public images may be in a public display bucket; draft/private assets in a private bucket with signed admin previews. Public objects are public even if a DB record is draft, so promoting/copying assets is an explicit operation.

Admin authorization: verified Supabase identity UUID plus server-controlled allowlist. No authority from email, local storage or user-editable metadata. Enable RLS on every exposed table; explicit minimal grants; anon reads published/visible rows only; authorized admins read/write permitted content. Harden security-definer role predicate with fixed search_path, no recursion and restricted execution grants. App needs no service-role key for normal operation. Offline seed mode is explicit and development-only, never successful mocked writes.

## Caching plan (implement/test in phase 7)

Public reads use a separate anonymous client with no session cookies and explicit public column projection. Cache independent groups (settings, projects, experience, education, skills, certifications, achievements, interests/navigation). Choose installed Next supported tag API; mutating Server Actions invalidate affected tags/paths including old/new slugs. Auth/authorization/admin/private/media previews never share caches. A DB failure must not silently substitute stale seed in production. Test write → invalidate → read, publication removal and slug changes.

## Tooling and official references checked 2026-10-15

Registry reports stable Next 16.4.1, React 19.3.1, Supabase SSR 0.12.7 / JS 2.117.3, Three 0.186.1 and Playwright 1.64.1. Recheck installed versions after install and use its shipped docs where present.

- [Next installation](https://nextjs.org/docs/app/getting-started/installation): App Router/manual install; Node ≥20.9; build does not run lint.
- [Next revalidateTag](https://nextjs.org/docs/app/api-reference/functions/revalidateTag): inspect profile/expiry semantics at phase 7; avoid obsolete one-argument assumptions.
- [React versions](https://react.dev/versions).
- [Supabase SSR](https://supabase.com/docs/guides/auth/server-side/creating-a-client?framework=nextjs): supported cookie helpers and Next 16 Proxy refresh; verified claims, never cookie-only getSession authorization.
- [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security): enable policies/grants explicitly, test roles.
- [Three manual](https://threejs.org/manual/) and [WebGLRenderer reference](https://threejs.org/docs/#api/en/renderers/WebGLRenderer): verify effect lifecycle/API at phase 6. No R3F chosen.
- [Playwright installation](https://playwright.dev/docs/intro): compatible Node, browser executable available; use installed Chrome for local tests and Playwright Chromium in CI.

Browser and localhost binds require sandbox escalation. Docker daemon 29.2.1 reachable with escalation; Supabase CLI/psql not installed. Use disposable local DB tooling in phase 2; hosted credentials not needed to begin. Do not attach to or mutate existing production containers.

## Phase 1 implemented

Next 16.4.1 / React 19.3.1 / TypeScript 7.0.2; strict TS, Biome 2.5.15, Playwright 1.64.1, tsx+Node tests. Original files unmodified; predev/prebuild synchronizes ignored public preview/assets. Root Server Component uses an explicit historical foundation snapshot in `lib/legacy-home.ts`; this is replaced by the typed DAL in phase 3. Original source fonts self-hosted through Fontsource packages, only matching unicode subsets requested by browser. Native mobile details menu works without hydration. `next typegen` precedes standalone type checking for fresh checkout compatibility. Baseline headers/noindex preview configured; full CSP/auth/database deferred to their phases. No database/Three/form dependencies installed prematurely.
