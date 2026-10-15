# Setup and deployment

## Current phase

Public migration, normalized database and full modeled content CMS/media/contact workflows are implemented locally. Visual polish/WebGL, cache/security/SEO hardening and final QA remain. Do not deploy this migration as the final portfolio until phase gates pass. Existing static sources remain intact. New Next routes require a Node deployment; static GitHub Pages cannot run Supabase SSR/admin mutations.

## Development

Node 22+, npm. `npm ci`; copy `.env.example` to `.env.local`; `npm run dev`. Never put real keys in tracked files. `npm run build` and `npm start` validate production rendering. Production build uses webpack to avoid sandbox-specific Turbopack subprocess/network restrictions; no Next APIs are changed.

Tests: format check, Biome, strict typecheck, unit tests, production build, then Playwright smoke. The current browser config targets system Chrome `/usr/bin/google-chrome`; make the executable configurable when preparing CI browser tests. Browser/server execution may require sandbox network approval in Codex. Static legacy preview was attempted at port 8000 but an existing process owns that port; do not stop unrelated processes.

## Supabase and hosting

Project creation, migration/seed, admin bootstrap and Storage steps are below. Vercel is the existing deployment target. Configure framework as Next.js and use the repository root; old CNAME is legacy documentation, not automatic canonical authority. No external deployment or production migration has been performed.

## Environment names

`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SITE_URL`, `PORTFOLIO_DEMO_MODE`, optional server-only `SUPABASE_SECRET_KEY`. Demo is development-only and explicitly enabled. Ordinary CMS uses owner Auth/RLS; stored contact intake requires the optional secret.

## Supabase setup and safe import (Phase 2)

1. Create a separate Supabase test project. Disable self-service signup in Auth settings. Set provider password/rate-limit controls. Do not use production data for initial QA.
2. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in `.env.local` or hosting environment. These are the documented publishable client credentials; no secret key is needed for public reads or the ordinary CMS. Set the eventual canonical `SITE_URL` explicitly.
3. Install/use the official Supabase CLI in your own environment. Run `npx supabase init`, `npx supabase link --project-ref YOUR_TEST_PROJECT_REF`, inspect all pending migrations, and run `npx supabase db push` on the **test** project. Production schema changes need owner approval. Alternatively apply every unapplied migration in filename order using an operator PostgreSQL connection, tracking applied versions. Do not reapply table creation to an existing database. Never apply `supabase/tests/platform.sql` to Supabase.
4. Generate/import seed: `npm run seed:generate`; review `data/seed-provenance.json`, then apply `supabase/seed.sql` with the Supabase SQL editor or `psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/seed.sql`. `DATABASE_URL` is operator tooling only, not a runtime/public variable. Seed inserts deterministic IDs with `ON CONFLICT DO NOTHING`, never updates or deletes existing owner records. All legacy content starts draft. Personal facts start private. Repeat imports are safe; conflicts are deliberately left for owner review.
5. Bootstrap an Auth user using Dashboard **Authentication / Users / Add user**. Use a strong password and keep credentials out of chat/source. Copy that user's UUID, then apply through the operator SQL editor:

```sql
insert into public.admin_profiles(user_id)
values ('YOUR_AUTH_USER_UUID')
on conflict do nothing;
```

Only operators can grant/revoke admin membership. Ordinary admin sessions cannot edit this table. Revocation is `DELETE` by an operator and is a deliberate external action; do not automate it in application UI.

6. The migration creates `portfolio-public` and `portfolio-private` buckets with a 10 MiB size cap and raster/PDF allowlist. Public bucket files are intentionally public even when an obscure URL is used. Store confidential/draft-only uploads in the private bucket. The CMS accepts files up to 3 MiB, re-encodes PNG/JPEG/WebP to stripped WebP and checks PDF format/type/extension. Private downloads authorize and expire in 60 seconds.
7. Review and publish imported settings, sections and items through the CMS. Facts require explicit public opt-in. Import never publishes legacy content automatically.

## Credential-free verification

`npm run test:db` executes the actual migration/seed and role policies in PGlite PostgreSQL with minimal Auth/Storage test interfaces. `npm run db:types:check` verifies generated types. `PORTFOLIO_DEMO_MODE=true` allows a development-only read preview; `NODE_ENV=production` always rejects demo mode. It rejects owner access/writes and never invents persistence.

## External checks still required

Before release, verify live cookie refresh/login/logout/revocation and direct non-admin requests in a configured test project; validate Storage HTTP upload/download/delete behavior; compare grants/policies against all existing project policies (permissive old policies can combine with new ones). Embedded policy tests and simulated HTTP services do not verify live GoTrue/PostgREST/Storage or platform defaults. No project was created or migrated externally during implementation.

## Preview and production privacy checks

For local content preview, set `PORTFOLIO_DEMO_MODE=true` in `.env.local`, then `npm run dev`. A visible development notice identifies imported legacy content. Production always ignores this flag. `npm run test:e2e` starts its own development preview and checks public sections, all 15 project routes, filters, images, private-field omission, keyboard/reduced motion and 320/768/1440px layout. The suite now uses a temporary source snapshot on port 3100 and preserves an existing port-3000 server.

After `npm run build`, `npm run test:production` starts the real production server on 3101 with the demo flag deliberately enabled and verifies the unpublished state/no draft projects/404. This particular test expects no configured Supabase credentials; live test-project workflows are a separate pending gate. `PLAYWRIGHT_CHROME_PATH` can override the system Chrome path.

## Current workstation disk issue

During Phase 3 QA, `/mnt/lab` reached zero free bytes and caused ENOSPC in both webpack and Playwright report writing. Only this migration's generated cache was relocated: `.next/cache` is an ignored symlink to `/tmp/farzine-portfolio-webpack-cache`. `.next` itself and `node_modules` remain in their normal repository locations. Moving the entire `.next` tree broke Node module resolution, so that attempt was reverted. The subsequent production build passed. No source/user files or unrelated data were removed.

This is a local workstation workaround, not a committed application requirement. Free space on the repository filesystem before larger remaining phases. On a fresh checkout npm/build creates ordinary directories. To restore this checkout after freeing enough space, stop this project's servers, unlink only the generated `.next/cache` symlink and move `/tmp/farzine-portfolio-webpack-cache` back to `.next/cache`; never remove unrelated directories.

## Using the core CMS (Phase 4)

Turn off `PORTFOLIO_DEMO_MODE` before connecting the CMS. Set the Supabase environment variables and apply the migration/seed to your authorized test project, then bootstrap membership as above. Open `/admin/login`; sign in with the provisioned owner. Failed and non-admin credentials receive a generic error. No signup route exists. Provider rate limits/password settings are configured in Supabase; review [Auth rate limits](https://supabase.com/docs/guides/auth/rate-limits).

Use Projects to create/edit, reorder, feature, draft/publish/archive, change slugs and choose existing covers. Save before opening a protected preview. Only published records appear publicly. Changing a slug currently withdraws the old URL; stable redirect history remains Phase 7. Delete requires exact title confirmation; media files remain intact. Site settings control identity, hero, biography, calls to action, portrait, footer, SEO defaults and optional legacy update label. Use Content collections for every remaining entity, section title/order/display, skills/groups, navigation/resume/documents and profile/contact facts. Publishing an item makes its record readable; hiding a section only removes it from the homepage. Unpublish content to withdraw public reads.

Editors retain values on failure and reject stale revisions from another tab. Reset discards only unsaved edits; navigation/logout asks before losing dirty forms. After a conflict, copy important edits, reload the record and merge deliberately. Unexpected errors are safe and actionable; detailed credentials/input are not logged.

Run `npm run test:cms` for desktop/mobile CMS workflow cases. It uses temporary source/build copies under /tmp, an HTTP test fixture at 54399 and Next at 3102. No env files or real project credentials are copied; all fixture records are isolated and discarded. Auth/Storage HTTP are simulated; PostgreSQL grants/RLS and actual SDK/SSR/Server Actions are real. `npm run test:e2e` similarly snapshots public preview at 3100. Neither suite stops the owner's running development server. Production checks continue on 3101 after building. Browser permissions may require Codex escalation.

Before release, repeat login/logout/expiry/revocation, CRUD, publication and stale-edit checks in the configured Supabase test project. A passing local fixture suite does not verify live provider behavior or production operational settings.

## Media, galleries and stored contact (Phase 5)

Apply migrations 002 (indexed uploaded-media references) and 003 (service-only contact intake/counters) as well as the initial schema. Run `npm run db:types:check` after changes. Existing image selectors preserve the legacy catalog; uploaded public raster images appear alongside them. Upload a new file to replace an asset, update every content reference, then remove the old unreferenced file. Metadata descriptions are editable. FKs block referenced deletion, including draft references. Failed Storage cleanup is reported and attempts metadata restoration; verify orphan cleanup using the Storage API/Dashboard, never delete storage.objects metadata manually.

Public upload opt-in makes a file independently accessible by URL, even if a project is still draft. Confidential assets must remain private. Bucket/public visibility is immutable through CMS replacement: upload a separate public copy when ready. PDF validation checks format/type/size, not malware or active-PDF content; upload trusted owner documents. For a resume, upload a public PDF, copy its public URL into Navigation and resume, choose purpose Resume, and publish the link. Galleries select a project and public image, with a required caption/order; publication follows the project.

Stored contact requires an optional dedicated Supabase secret API key in the server/hosting environment as `SUPABASE_SECRET_KEY`. Never prefix it NEXT_PUBLIC_, put it in Git/chat, or reuse it in the SSR browser/session client. Secret keys bypass RLS; the isolated intake module uses only the bounded service-only RPC. Configure the key via [Supabase API keys](https://supabase.com/docs/guides/getting-started/api-keys). Enable stored contact in Site settings and publish/show the Contact section. Without server configuration or in demo mode the form is absent. Success means stored privately, with no email notification. Owner inbox supports read/delete and 25-item pagination.

The database caps intake at five messages per HMAC fingerprint per hour and 100 globally per hour. Vercel's overwritten X-Forwarded-For supplies the address only under VERCEL=1. Other hosting uses one conservative shared bucket; configure and verify a trusted-proxy strategy before raising limits. Raw IPs are not stored. Rate windows older than two days are cleaned during enabled submissions. Set provider/hosting abuse monitoring and verify a real failed storage response, rate rejection and disabled form before release.

Back up Postgres and Storage independently before production migrations. Keep migrations versioned; test restore and non-overwriting seeds against a separate test project. No production migration, upload, contact submission, deletion or deployment has been performed here.

## Optional orbit (Phase 6)

Apply migration 004 with other unapplied migrations. Site settings offers an orbit display preference. Visitors activate the desktop feature explicitly; it never auto-loads on mobile, reduced motion, low capabilities or data-saving mode. WebGL failure retains the portrait/static art. Graphics use direct Three.js, no extra scene/animation framework. The suite uses software WebGL only to exercise rendering and disposal; verify actual laptop hardware as part of release QA.
