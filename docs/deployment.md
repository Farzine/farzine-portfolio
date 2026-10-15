# Deployment (not yet authorized)

No push or deployment has been performed. The completed target is Vercel-compatible Next.js App Router + Supabase. This phase is a local foundation; CMS and public production integration are still pending; migrations and locally tested RLS are now available. Do not deploy this interim state as the final portfolio.

Build locally with `npm ci && npm run build`; serve with `npm run start` (Node 22). Source assets are synchronized during build; generated copies need not be committed. Current `.env.example` contains names/placeholders only. Set real values in local/hosting environment, never source/chat. [Supabase setup](supabase.md) now covers migrations/seed, first-admin UUID provisioning, public/private buckets and local policy tests. Hosted verification, backup operations, cache and full post-deploy verification remain for later phases.

See [setup](setup.md), [security](security.md), [implementation plan](implementation-plan.md), and [CONTEXT](../CONTEXT.md).
