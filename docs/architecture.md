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

## Phase 2 implemented

Sixteen normalized public tables plus private admin/provenance, explicit RLS/grants and two Storage bucket policies in `supabase/migrations/202610150001_portfolio.sql`. Database types generated with official CLI 2.121.0 from actual migrated local Postgres; `lib/types/legacy-seed-check.ts` enforces seed insert compatibility. Source importer disables scripts/remote requests and creates 28 historical media refs, 15 draft projects, nine certificates, four experiences, five achievements, 36 skills, eight interests and all settings/navigation/doc/contact fields. Imported collections invisible by default, personal facts private; structural sections/navigation and existing public identity/media visible. No inferred institution name or dates. Seed conflict handling never overwrites owner changes.

Auth helpers are server-only public/session factories; cookies HTTP-only with server-managed login planned. No browser auth client needed for Server Action CMS. Provider-default getAll/setAll integration with Next Proxy and cache-header forwarding; `requireAdmin` independently verifies claims + server-controlled UUID allowlist. No service-role credential. No DB-backed public page yet (Phase 3). [Supabase setup](supabase.md) distinguishes real SQL/RLS verification with minimal provider contracts from outstanding full provider HTTP verification.

## Phase 3 implemented

`lib/dal/portfolio.ts` uses explicit typed query projections via the anonymous server-only client. `lib/content/public-model.ts` constructs narrow DTOs, independently filters publication/visibility, validates links/asset paths and never returns private/provenance/status fields. Home/all sections are Server Components; navigation, filters, native project dialogs and failed-logo fallback are small client boundaries. CSS hash targets preserve section switching with JS disabled; plain-text paragraphs/bullets are escaped by React. Project dialogs receive server-rendered published detail content, avoiding client DB calls. Real routes `/projects` and `/projects/[slug]` support no-JS filter GETs, canonical metadata, genuine private/unknown 404s and legacy detail redirects.

Public routes currently use force-dynamic + React cache for deduplication within one server render. No auth/session reads occur in public DAL; independent shared tags/invalidation are intentionally Phase 7. Detail reads reuse the small public portfolio dataset (15 projects); narrow paginated reads if the collection grows. Failures log group/code only and surface safe recovery; metadata failures return noindex fallback rather than escaping the page error boundary.

Historical preview is explicit development/test only, server-only dynamic seed import, noindex with a notice and private facts excluded. Production seed mode is an HTTP 500/error-state test, never fallback content. Full isolated Supabase now runs locally; its actual anonymous Data API is tested for public reads, draft/private exclusion and denied writes. `scripts/with-local-supabase.mjs` injects local URL/publishable key into a process without writing/printing values. Auth/Storage byte workflows remain Phases 4/5.

Build sync now copies assets/icon only and archives any generated legacy HTML outside public in `.legacy-preview`; source HTML/assets/project directories remain intact. Native dialogs replace iframe/vendor JS while retaining source modal proportions; original style/template attribution preserved. [Phase 3 evidence](qa/phase-3.md) records verification and remaining parity/audit work.

## Phase 4 admin slice

`app/admin/(protected)` owns authenticated pages; every private read uses a page guard that redirects invalid/non-admin sessions. `lib/dal/admin.ts` independently authorizes each read/write; `app/admin/actions.ts` repeats authorization at each CMS action boundary before parsing or mutation. Login uses supported password Auth and then the UUID predicate, returning a generic error for wrong credentials/non-admin identities; logout is available even to revoked/non-admin sessions. No public registration or email-based authorization. Provider integration references: [password login](https://supabase.com/docs/reference/javascript/auth-signinwithpassword), [logout](https://supabase.com/docs/reference/javascript/auth-signout), [Server Action security](https://nextjs.org/docs/app/guides/server-actions).

Explicit Zod settings/project/gallery schemas read only declared fields. Reusable accessible form controls render these structured fields; no arbitrary table gateway/page builder. Forms preserve local input on errors, announce status, disable pending writes and prompt on link/unload navigation. Conditional `updated_at` updates and deletes reject stale records; revision tokens stay fixed until that form successfully saves. Private saved-draft preview never enters the public DAL/cache. Existing assets are selectable, published image references validated; byte upload/signing/cleanup remains Phase 5. Gallery saves upsert on project+asset, making caption/order edits and retries deterministic.

Public routes still dynamic; mutations revalidate affected public listing/detail old/new slug paths and admin views. Content-tag sharing and more precise collection invalidation remain Phase 7. The tiny CMS lists use native GET search/filter/sort, no table library. Local Auth provisioning uses a separate test-only script with loopback/container checks, never an app service-role env/key.

## Phase 5 complete CMS and media boundary

`lib/validations/collections.ts` defines explicit schemas for twelve source collections/settings plus fixed public labels. The shared editor is a small allowlisted form pattern for these actual collections, not an unrestricted table gateway: field definitions are checked against schema keys, every mutation has a literal-table typed branch in `lib/dal/collections.ts`, and actions/DAL authorize independently. IDs/revisions/payload fields are validated; timestamps/roles/unknown fields cannot be submitted as writes. Structural section/label keys cannot be created/deleted. `public_labels` adds one RLS table (17 public content tables total); explicit public DTOs apply its fixed keys with historical defaults for development preview.

Media uses its own authorized DAL, bounded upload route, private no-store byte proxy and simple library. sharp is an explicit server dependency (already supplied transitively by Next) for actual decoding/normalization; no client image-processing package. Media is immutable apart from label/alt text and a monotonic deletion tombstone. FK/reference triggers and row locks prevent new references racing cleanup. A volatile reference predicate is necessary for fresh post-lock snapshots; the policy harness tests both concurrent orders. The app verifies Storage absence before metadata deletion and exposes retryable cleanup state. See [media workflow](media.md) for the separate-system registration failure limit and public byte semantics.

Public components retain the original structure/CSS/default copy. Only editable display-label props and private-preview image handling were added. Public DAL remains anonymous/dynamic; React cache only deduplicates per render. Actions refresh affected public/admin paths; shared collection tags and precise cache invalidation/isolation remain Phase 7. No contact-message endpoint was added because the source uses contact links and no sender/storage flow was requested beyond supported infrastructure.
