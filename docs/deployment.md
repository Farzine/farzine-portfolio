# Deployment (not yet authorized)

No push or deployment has been performed. The completed target is Vercel-compatible Next.js App Router + Supabase. The database-backed public migration, migrations and locally tested RLS are implemented. CMS, final themes/WebGL, shared caching, hardening and final QA remain. Do not deploy this interim state as the final portfolio.

Build locally with `npm ci && npm run build`; serve with `npm run start` (Node 22). Source assets are synchronized during build; generated copies need not be committed. Current `.env.example` contains names/placeholders only. Set real values in local/hosting environment, never source/chat. [Supabase setup](supabase.md) now covers migrations/seed, first-admin UUID provisioning, public/private buckets and local policy tests. Hosted verification, backup operations, cache and full post-deploy verification remain for later phases.

See [setup](setup.md), [security](security.md), [implementation plan](implementation-plan.md), and [CONTEXT](../CONTEXT.md).

Phase 3 verification uses a full local Supabase stack, not hosted credentials: real anonymous Data API/public HTML boundaries tested. Never apply `supabase/tests/public-fixture.sql` to hosted data; it is a local publication fixture, not a production seed. Production imports remain draft/invisible for owner review. Build with the actual Supabase URL so the exact public Storage image origin is allowlisted; unconfigured requests fail safely. See [local setup](setup.md) for reproducible integration commands.
