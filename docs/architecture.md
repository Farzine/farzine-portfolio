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
