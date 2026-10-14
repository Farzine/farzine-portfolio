# Setup and deployment

## Current phase

Public migration and database foundation implemented; CMS work remains. Do not deploy this migration as the final portfolio until phase gates pass. Existing static sources remain intact. New Next routes require a Node deployment; static GitHub Pages cannot run Supabase SSR/admin mutations.

## Development

Node 22+, npm. `npm ci`; copy `.env.example` to `.env.local`; `npm run dev`. Never put real keys in tracked files. `npm run build` and `npm start` validate production rendering. Production build uses webpack to avoid sandbox-specific Turbopack subprocess/network restrictions; no Next APIs are changed.

Tests: format check, Biome, strict typecheck, unit tests, production build, then Playwright smoke. The current browser config targets system Chrome `/usr/bin/google-chrome`; make the executable configurable when preparing CI browser tests. Browser/server execution may require sandbox network approval in Codex. Static legacy preview was attempted at port 8000 but an existing process owns that port; do not stop unrelated processes.

## Supabase and hosting

To be completed in Phase 2: project creation, migrations, safe seed, admin bootstrap and Storage. Vercel is the existing deployment target. Configure framework as Next.js and use the repository root; old CNAME is legacy documentation, not automatic canonical authority. No external deployment or production migration has been performed.

## Environment names

`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SITE_URL`, `PORTFOLIO_DEMO_MODE`. Demo will be development-only and explicitly enabled. Runtime should not require service-role credentials.

## Supabase setup and safe import (Phase 2)

1. Create a separate Supabase test project. Disable self-service signup in Auth settings. Set provider password/rate-limit controls. Do not use production data for initial QA.
2. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in `.env.local` or hosting environment. These are the documented publishable client credentials; no service-role key is needed for current runtime. Set the eventual canonical `SITE_URL` explicitly.
3. Install/use the official Supabase CLI in your own environment. Run `npx supabase init`, `npx supabase link --project-ref YOUR_TEST_PROJECT_REF`, inspect the pending migration, and run `npx supabase db push` on the **test** project. Production schema changes need owner approval. Alternatively apply the single migration using an operator PostgreSQL connection. Never apply `supabase/tests/platform.sql` to Supabase.
4. Generate/import seed: `npm run seed:generate`; review `data/seed-provenance.json`, then apply `supabase/seed.sql` with the Supabase SQL editor or `psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/seed.sql`. `DATABASE_URL` is operator tooling only, not a runtime/public variable. Seed inserts deterministic IDs with `ON CONFLICT DO NOTHING`, never updates or deletes existing owner records. All legacy content starts draft. Personal facts start private. Repeat imports are safe; conflicts are deliberately left for owner review.
5. Bootstrap an Auth user using Dashboard **Authentication / Users / Add user**. Use a strong password and keep credentials out of chat/source. Copy that user's UUID, then apply through the operator SQL editor:

```sql
insert into public.admin_profiles(user_id)
values ('YOUR_AUTH_USER_UUID')
on conflict do nothing;
```

Only operators can grant/revoke admin membership. Ordinary admin sessions cannot edit this table. Revocation is `DELETE` by an operator and is a deliberate external action; do not automate it in application UI.

6. The migration creates `portfolio-public` and `portfolio-private` buckets with a 10 MiB size cap and raster/PDF allowlist. Public bucket files are intentionally public even when an obscure URL is used. Store confidential/draft-only uploads in the private bucket. Application upload validation/reference safety is Phase 5; do not expose upload UI yet.
7. Review and publish imported settings/items through the CMS once Phase 4/5 are complete. Until then, database records remain drafts and production has no legacy content silently published.

## Credential-free verification

`npm run test:db` executes the actual migration/seed and role policies in PGlite PostgreSQL with minimal Auth/Storage test interfaces. `npm run db:types:check` verifies generated types. `PORTFOLIO_DEMO_MODE=true` allows a development-only read preview; `NODE_ENV=production` always rejects demo mode. It never authorizes writes or invents persistence.

## External checks still required

Before release, verify live cookie refresh/login/logout/revocation and direct non-admin requests in a configured test project; validate Storage HTTP upload/download/delete behavior; compare grants/policies against all existing project policies (permissive old policies can combine with new ones). Embedded policy tests do not verify GoTrue, PostgREST, Storage HTTP, or platform defaults. No project was created or migrated externally during implementation.

## Preview and production privacy checks

For local content preview, set `PORTFOLIO_DEMO_MODE=true` in `.env.local`, then `npm run dev`. A visible development notice identifies imported legacy content. Production always ignores this flag. `npm run test:e2e` starts its own development preview and checks public sections, all 15 project routes, filters, images, private-field omission, keyboard/reduced motion and 320/768/1440px layout. Do not run another server on port 3000 during this suite.

After `npm run build`, `npm run test:production` starts the real production server on 3101 with the demo flag deliberately enabled and verifies the unpublished state/no draft projects/404. This particular test expects no configured Supabase credentials; live test-project workflows are a separate pending gate. `PLAYWRIGHT_CHROME_PATH` can override the system Chrome path.

## Current workstation disk issue

During Phase 3 QA, `/mnt/lab` reached zero free bytes and caused ENOSPC in both webpack and Playwright report writing. Only this migration's generated cache was relocated: `.next/cache` is an ignored symlink to `/tmp/farzine-portfolio-webpack-cache`. `.next` itself and `node_modules` remain in their normal repository locations. Moving the entire `.next` tree broke Node module resolution, so that attempt was reverted. The subsequent production build passed. No source/user files or unrelated data were removed.

This is a local workstation workaround, not a committed application requirement. Free space on the repository filesystem before larger remaining phases. On a fresh checkout npm/build creates ordinary directories. To restore this checkout after freeing enough space, stop this project's servers, unlink only the generated `.next/cache` symlink and move `/tmp/farzine-portfolio-webpack-cache` back to `.next/cache`; never remove unrelated directories.
