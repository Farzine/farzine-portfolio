# Deployment (not yet authorized)

No push or deployment has been performed. Target: Vercel-compatible Next.js App Router + Supabase. Public migration, all structured CMS/media, real local Auth/RLS, themes/optional WebGL, isolated public caching, CSP and SEO are implemented and locally tested. Final comprehensive QA and operational handoff remain Phase 8; hosted integration has not been verified.

Build locally with `npm ci && npm run build`; serve with `npm run start` (Node 22). Source assets are synchronized during build; generated copies need not be committed. Current `.env.example` contains names/placeholders only. Set real values in local/hosting environment, never source/chat. [Supabase setup](supabase.md) now covers migrations/seed, first-admin UUID provisioning, public/private buckets and local policy tests. Hosted verification, backup operations, cache and full post-deploy verification remain for later phases.

See [setup](setup.md), [security](security.md), [implementation plan](implementation-plan.md), and [CONTEXT](../CONTEXT.md).

Phase 3 verification uses a full local Supabase stack, not hosted credentials: real anonymous Data API/public HTML boundaries tested. Never apply `supabase/tests/public-fixture.sql` to hosted data; it is a local publication fixture, not a production seed. Production imports remain draft/invisible for owner review. Build with the actual Supabase URL so the exact public Storage image origin is allowlisted; unconfigured requests fail safely. See [local setup](setup.md) for reproducible integration commands.

Phase 4 verifies real local password login/logout/refresh, closed signup, allowlist authorization and settings/project/gallery mutations (including direct POST replay denial). See [owner workflow](admin.md). Hosted prerequisites remain owner provisioning, disabled signup with email provider enabled, Auth abuse controls and recovery/invite configuration. Test fixture users/passwords and `supabase/tests` files are never a production bootstrap. Real application environment still needs only the public URL/key, never a service-role key.

Before a future deployment, apply every reviewed migration through the normal migration process (not fixtures), provision the owner, and verify the media upload origin/forwarded-header behavior on the actual host. Use a Node runtime supporting sharp; no browser/serverless Edge image processing is assumed. [Media operations](media.md) covers immutable replacement, public-cache privacy and rare orphan recovery. Hosted checks have not been run.


The fixed theme bootstrap and optional interaction-loaded Three.js chunk work under the production nonce CSP in local Chrome. WebGL2 is optional: mobile/reduced-motion/low-resource/data-saving/failure paths retain CSS and links. No GPU runtime/package is needed on the server. A physical mid-range-phone audit and hosted CDN/Core Web Vitals measurements remain deployment verification; headless local timings are not production performance claims.

## Cache, proxy and SEO requirements

Set `NEXT_PUBLIC_SITE_URL` to the final HTTPS origin. The CMS canonical URL overrides this environment fallback; review both and the owner-editable titles/descriptions/social image/icon. `/sitemap.xml` contains only published detail routes plus enabled listing/root; `/robots.txt` disallows admin/auth/retired legacy routes. No real dates/metrics are inferred for metadata. Empty canonical configuration produces no invented domain.

Honor `Cache-Control: private, no-store` for HTML/RSC/metadata/admin responses. Each has a fresh CSP nonce; never add an HTML CDN cache rule that reuses it. Static assets remain immutable/cacheable. Shared anonymous DB data uses independent Next Data Cache tags; [architecture](architecture.md#public-caching-and-invalidation-phase-7) explains invalidation. Vercel's shared cache or one Node server is the supported deployment shape. Multiple Node replicas require a shared cache/tag handler and cross-replica write/withdrawal tests before use.

Configure reverse proxies to preserve the correct public Host and normalize forwarded-proto/forwarded-host. Reject untrusted forwarding headers at the edge. HTTPS responses add HSTS and upgrade-insecure-requests; this has only been tested locally through request/header simulation, not a real TLS edge. Verify provider image origin at build time, login cookies, Server Actions Origin checks, upload origin validation, nonce hydration and lazy chunks on the deployed hostname. No broad CSP script exception should be added to fix a misconfigured proxy.

Use CMS writes for prompt invalidation. Direct SQL/Dashboard changes do not emit Next tags; re-save the affected item through CMS or purge the platform data cache. The 60-second stale-while-revalidate interval is a fallback for such edits/scheduled publication, not a guaranteed withdrawal deadline during outages. Never use publication flags to promise confidentiality for previously public Storage bytes.
