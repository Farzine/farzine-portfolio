# Architecture

## Boundaries

Root Next.js App Router, strict TypeScript, Server Components for content. Presentational components receive explicit DTOs. `lib/dal/` owns public reads and privileged writes; server-only guards prevent accidental client imports. Client islands are limited to form interaction and an optional lazy WebGL enhancement.

Supabase SSR uses the documented cookie integration and Next 16 `proxy.ts` session refresh. Privileged entry points independently verify the session and query a server-controlled admin allowlist. No authorization from email, editable auth metadata, UI layout, or unverified `getSession()`. Normal runtime uses only a publishable key and RLS; service role is not necessary.

## Content and privacy

Normalized tables model real entities. All imported records start draft. Public DTOs contain only public fields and published records. Sensitive facts are separate from public settings and have deliberate visibility. No raw HTML renderer. All dates and factual claims retain their source wording. Inventory and later seed script retain source provenance.

## Rendering and caching

Public queries use a session-free Supabase client; no cookies or authorization results enter shared caches. Tag groups will follow settings/projects/experience/education/certifications/achievements/skills/sections. Choose installed-version APIs at Phase 7. Admin/session/messages remain dynamic and private. Mutations invalidate affected groups, paths, old/new slugs after successful persistence. Tests must verify write/invalidate/read rather than mock only invalidation calls.

## Migration and assets

Static sources remain at root for audit/reversibility. Next serves new `app/` routes. Display images are copied with unchanged filenames into `public/assets/img/`; vendors are not bundled. Public legacy HTML is not copied (contains contact details and tracking). Asset duplication is intentional during migration; future deletion requires owner review. Stable project slugs and redirects preserve useful old links.

## Decisions and official references

Plain CSS variables avoid a second styling abstraction. Direct Three.js, if needed, avoids overlapping canvas frameworks. Local fonts will avoid build-time font-network dependence. npm matches installed tools; lock versions after registry verification.

Checked 2026-10-14: [Next installation](https://nextjs.org/docs/app/getting-started/installation), [React versions](https://react.dev/versions), [Supabase SSR clients](https://supabase.com/docs/guides/auth/server-side/creating-a-client?framework=nextjs), [Three.js](https://threejs.org/docs/), [R3F compatibility](https://r3f.docs.pmnd.rs/getting-started/installation), [Playwright](https://playwright.dev/docs/intro), [Next testing](https://nextjs.org/docs/app/guides/testing/playwright), [Next cache](https://nextjs.org/docs/app/api-reference/functions/unstable_cache), [revalidateTag](https://nextjs.org/docs/app/api-reference/functions/revalidateTag), [CSP](https://nextjs.org/docs/app/guides/content-security-policy).

Tooling decision: Biome replaces the initial ESLint config because npm audit traced five high dev advisories to an unpatched braces dependency. Biome provides TypeScript/JSX/accessibility lint without that chain; Prettier handles code and Markdown formatting. Official Next installation supports Biome. [Biome setup](https://biomejs.dev/installation/quick-start/).

## Phase 2 database and SSR

`supabase/migrations/202610140001_portfolio.sql` creates 17 normalized public tables with RLS and explicit grants. Status/order indexes serve public content; foreign keys have indexes. Literal `date_label` values avoid guessing calendar dates. Sensitive facts live separately with default `is_public=false`. Contact messages have no anonymous grants. The admin mapping is immutable through the application: provision with an operator connection only.

`private.is_admin()` runs with a locked search path and checks `auth.uid()` against the admin mapping. It is outside the exposed public schema. Public skills require a published parent group; gallery records require a published project and public media. Public Storage objects are intentionally retrievable by URL; private drafts/documents belong in the private bucket. Never treat an obscure public URL as private.

`lib/supabase/server.ts` separates session-aware and session-free clients. Read-only Server Components defer cookie refresh to `proxy.ts`; mutations must use writable cookies. Proxy is limited to admin/auth paths and forces private/no-store headers, including SDK cookie-write cache headers. `requireAdmin` verifies through Auth `getUser()` and immutable membership on every invocation. There is no authorization cache or service key.

`npm run db:types` introspects the actual applied migration in embedded PostgreSQL, including nullability/defaults/enums/foreign keys. `npm run db:types:check` detects drift. This is reproducible without credentials. On a configured Supabase project, additionally compare with official `supabase gen types typescript --local` output; test platform stubs model Auth UID and Storage table interfaces, not the live services.

## Phase 3 public application

`lib/dal/public.ts` uses a session-free publishable client, status/visibility filters, explicit column selections and Zod public projections. React `cache()` deduplicates within the request; it is not a shared authorization cache. Phase 3 routes are intentionally dynamic until tagged caching is implemented/tested in Phase 7. Project detail/list helpers currently share the full homepage read; split/cache groups in Phase 7 before claiming query efficiency.

`lib/dal/demo.ts` is guarded server-only and refuses all environments except explicit `NODE_ENV=development` plus `PORTFOLIO_DEMO_MODE=true`. It previews copies of preserved draft records and omits personal facts. It never writes or grants admin privileges. Production without published settings shows an honest empty state and no seed projects.

Reusable public section/card components render editable content; project categories use URL navigation and work without client filtering state. All 15 old project HTML paths plus `/index.html` redirect to the new routes. Existing asset names remain; Next Image reserves dimensions and optimizes sizes. Image origins are limited to local legacy image paths and this project's public Storage bucket. Profile data and page-specific metadata are validated. Sitemap, root metadata defaults, CSP and tagged invalidation remain Phase 7.

## Phase 4 owner CMS

`app/admin/(protected)/` provides overview, filtered project list, project create/edit/private preview and site settings. `requireAdminPage` gives safe redirects for private reads; `lib/dal/admin.ts` independently invokes fresh `requireAdmin` before every write and validates explicit project/settings schemas. Actions delegate to these narrow guarded operations. No generic unchecked table gateway or service key exists. Development seed mode rejects owner access and content writes even if real credentials are present.

Forms use small client islands with React useActionState, controlled values, field-associated errors, pending states, live feedback and unsaved-change navigation protection. Controlled values preserve edits across server validation failures. Successful responses provide normalized values and updated revisions. Optimistic `updated_at` comparisons reject concurrent stale saves/deletes. Destructive deletion requires the exact saved project title; archiving preserves a private record. Saved draft preview is an independently guarded server route and never changes publication state.

Existing images are selected from the inventory-backed catalog; runtime directory scans are avoided for serverless compatibility. New uploads/shared media relationships remain Phase 5. All setting/project fields supported by the public application are editable except contact intake, which remains unavailable until its backend is implemented. Sections and remaining entity collections are Phase 5. Changing project slugs currently makes the old slug 404; old/new public paths are invalidated, while a permanent slug-history strategy belongs to Phase 7.

Content actions currently revalidate affected paths, including both old/new project URLs and the current editor. Public routes still read dynamically; tagged group caches and their write/invalidate/read tests remain Phase 7. Admin reads/membership/results are never cached globally.

CMS browser tests exercise the real Next application, SSR clients and Server Actions against an isolated HTTP Auth/PostgREST fixture. Auth is simulated with test-signed tokens and provider verification; database constraints/grants/RLS run in PostgreSQL/PGlite. Temporary source snapshots/builds under /tmp avoid interfering with an existing owner dev server or the crowded repository disk. This does not substitute for live Supabase Auth/Storage verification.

## Phase 5 complete content model

Remaining content uses a closed, typed discriminated union in `lib/validations/admin-collections.ts`. Each schema maps to an explicit typed Supabase table branch in `lib/dal/admin-collections.ts`; arbitrary tables/columns/roles are never accepted. Small collections share accessible controlled fields and revision handling. Group/image/project relationships use real selectors. Sections change homepage display order/visibility; publication controls API visibility independently. Private facts require explicit per-field publication.

Migration 002 adds indexed RESTRICT foreign keys for uploaded profile, education/certification images and navigation documents, alongside existing covers/gallery FKs. Original catalog paths stay supported. Storage keys are random UUIDs (no owner identity), objects immutable. Uploads default private; public opt-in makes the asset URL independently public even for a draft. Images decode with Sharp, reject unsupported/mismatched/oversized formats, strip metadata and re-encode to WebP. PDF uploads receive type/extension/size/signature checks; they are owner-supplied documents, not malware-scanned. Private downloads authorize independently and use 60-second signed links. Metadata deletion first enforces FK references, then removes Storage bytes; failure attempts metadata restoration and reports an error. Shared files are never automatically removed when content changes.

Contact intake alone uses an optional server-only Supabase secret key. It calls the service-only security-invoker RPC in migration 003. SQL checks published settings/contact section and applies atomic hourly counters (5 per HMAC fingerprint, 100 global); only stored results become success. No notifications are claimed or sent. Vercel trusted forwarding headers supply a hashed IP; other hosts use a conservative shared bucket until a trusted proxy strategy is implemented. Raw IPs are never stored. Counters older than two days are cleaned during enabled intake. Owner messages are private/dynamic and paginated at 25 per page.

Public galleries return explicit URL/alt/caption/dimension DTOs and inherit project/media RLS. Current public reads and path invalidation remain dynamic; independent tags and narrower public queries are Phase 7. Browser tests exercise SDK/SSR/actions with simulated Auth/Storage HTTP backed by real PostgreSQL policies. Real provider behavior remains external verification.

## Phase 6 optional orbit

The portrait remains ordinary SSR HTML. `components/three/profile-orbit.tsx` is a small interaction boundary; its Three.js scene imports only after explicit activation. The owner can disable `orbit_enabled` (migration 004). Desktop fine-pointer, no reduced motion, sufficient CPU/memory and no data-saving preference are required to offer activation. Mobile/low-capability/no-JS users get the unchanged static orbit and portrait. Two small unlit primitives render only on resize/rotation/visibility demand, with DPR capped at 1.5. Keyboard buttons sit outside the decorative canvas. Observers/frames/listeners, geometry/materials and renderer/context are disposed. Each setup creates a fresh canvas so React Strict Mode cleanup/replay cannot reuse a released context. WebGL/load failures retain the fallback.

Observed separate graphics chunk: 356436 raw bytes / 84174 gzip bytes before the small final lifecycle adjustment. Browser network test verifies no graphics download before activation; software WebGL draws do not continue while idle/offscreen, and buffer deletion occurs on close. This is headless SwiftShader coverage, not a mid-range phone/hardware benchmark. Production applies the major-performance-caveat check and may retain fallback on software-only devices.
