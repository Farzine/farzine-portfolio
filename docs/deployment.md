# Deployment (not yet authorized)

No push or deployment has been performed. The completed target is Vercel-compatible Next.js App Router + Supabase. The database-backed public migration, migrations and locally tested RLS are implemented. Core settings/project CMS and real local Auth are implemented; full content/media CMS is implemented locally; final themes/WebGL, shared caching, hardening and final QA remain. Do not deploy this interim state as the final portfolio.

Build locally with `npm ci && npm run build`; serve with `npm run start` (Node 22). Source assets are synchronized during build; generated copies need not be committed. Current `.env.example` contains names/placeholders only. Set real values in local/hosting environment, never source/chat. [Supabase setup](supabase.md) now covers migrations/seed, first-admin UUID provisioning, public/private buckets and local policy tests. Hosted verification, backup operations, cache and full post-deploy verification remain for later phases.

See [setup](setup.md), [security](security.md), [implementation plan](implementation-plan.md), and [CONTEXT](../CONTEXT.md).

Phase 3 verification uses a full local Supabase stack, not hosted credentials: real anonymous Data API/public HTML boundaries tested. Never apply `supabase/tests/public-fixture.sql` to hosted data; it is a local publication fixture, not a production seed. Production imports remain draft/invisible for owner review. Build with the actual Supabase URL so the exact public Storage image origin is allowlisted; unconfigured requests fail safely. See [local setup](setup.md) for reproducible integration commands.

Phase 4 verifies real local password login/logout/refresh, closed signup, allowlist authorization and settings/project/gallery mutations (including direct POST replay denial). See [owner workflow](admin.md). Hosted prerequisites remain owner provisioning, disabled signup with email provider enabled, Auth abuse controls and recovery/invite configuration. Test fixture users/passwords and `supabase/tests` files are never a production bootstrap. Real application environment still needs only the public URL/key, never a service-role key.

Before a future deployment, apply every reviewed migration through the normal migration process (not fixtures), provision the owner, and verify the media upload origin/forwarded-header behavior on the actual host. Use a Node runtime supporting sharp; no browser/serverless Edge image processing is assumed. [Media operations](media.md) covers immutable replacement, public-cache privacy and rare orphan recovery. Hosted checks have not been run.


Phase 6 adds a fixed theme bootstrap script and optional interaction-loaded Three.js chunk. Phase 7 must validate CSP compatibility with the exact script and dynamic chunks. WebGL2 is optional: mobile/reduced-motion/low-resource/data-saving/failure paths retain CSS and links. No GPU runtime/package is needed on the server. A physical mid-range-phone audit and hosted CDN/Core Web Vitals measurements remain final deployment verification; headless local timings are not production performance claims.
