# Deployment (not yet authorized)

No push or deployment has been performed. The completed target is Vercel-compatible Next.js App Router + Supabase. This phase is a local foundation; CMS, RLS and production content integration are still pending. Do not deploy this interim state as the final portfolio.

Build locally with `npm ci && npm run build`; serve with `npm run start` (Node 22). Source assets are synchronized during build; generated copies need not be committed. Current `.env.example` contains names/placeholders only. Set real values in local/hosting environment, never source/chat. Final Supabase project setup, versioned migration/seed, admin provisioning, buckets, backups, cache and post-deploy verification will be documented after their tested implementation.

See [setup](setup.md), [security](security.md), [implementation plan](implementation-plan.md), and [CONTEXT](../CONTEXT.md).
