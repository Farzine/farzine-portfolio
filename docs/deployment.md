# Deployment (not yet authorized)

No push or deployment has been performed. Target: Vercel-compatible Next.js App Router + Supabase. Public migration, structured CMS/media, real local Auth/RLS, themes/optional WebGL, isolated public caching, CSP and SEO are implemented and locally tested. [Final QA](qa/phase-8.md) distinguishes executed local checks from outstanding hosted integration.

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

## Environment and release procedure

| Name | Where / purpose |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Build/runtime: final HTTPS origin, fallback when CMS canonical is empty. |
| `NEXT_PUBLIC_SUPABASE_URL` | Build/runtime: actual project origin, also pins public Storage image optimization. |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Build/runtime: publishable key (or legacy anon JWT), protected by RLS. Never a secret/service key. |
| `PORTFOLIO_USE_DEV_SEED` | Development-only optional preview. Omit or false on host; true deliberately fails in production. |
| `PORTFOLIO_TYPES_DB_URL` | Operator type-generation tooling only; do not configure in the deployed app. |

1. Use Node22.x, locked `npm ci`, configured environment and Node runtime/native sharp. Build command `npm run build`; standard Next framework preset on Vercel. Self-hosting uses `npm run start` behind TLS proxy to loopback3000, with process supervision. Static export/GitHub Pages and Edge-only uploads are not supported. No Docker/CLI is required by the deployed app.
2. Create a separate staging Supabase project. Follow [bootstrap](supabase.md#owner-project-bootstrap-manual-never-paste-keys-in-chat), applying reviewed migrations001–005 in order, then repeatable seed. Never apply `supabase/tests` or fixture users to hosted data. Disable global signup, enable password email provider, configure actual site URLs, provider rate limits/monitoring and a verified operator-managed owner password/recovery procedure. The current app has no invitation-token/password-reset callback UI; do not send those links to the homepage and assume setup succeeds. Set the private UUID allowlist as DB operator. No public setup endpoint.
3. Inspect pre-existing grants/policies if reusing a project; additive RLS policies do not remove broader old access. Verify bucket privacy, upload MIME/size limits, Storage write/delete grants and fixed-path role helper. Review imported claims/dates/images/links and choose publication explicitly. Seed preserves owner edits on repeat, it does not refresh changed source text.
4. Run local checks from [setup](setup.md), then staging manual checks below using dedicated test content. A deployment preview can share the same DB: do not casually test deletion/publication against the owner's real data. Build with that deployment's exact environment. Confirm the canonical URL and supported custom domain deliberately; old `CNAME` is historical.
5. Promote only with owner authorization after staging gate; no push, migration, external deletion or deployment was performed here. Retain previous application release and backup references for rollback. Follow-up DB changes require new reviewed migrations; never rewrite applied files/reset production. There is no automated downgrade migration.

## Backup, recovery and maintenance

Before schema changes or bulk edits, create an encrypted off-site database backup with the operator's approved Supabase backup/CLI process, including content, private allowlist and required role/Auth schema state. Verify the chosen backup's coverage; do not assume a default public-schema-only export includes Auth/private roles. Record migration version, app commit and backup time without committing keys/dumps. Select retention according to the actual provider plan; do not assume a free project has managed recovery.

**Storage file bytes need a separate backup**; database backups contain Storage metadata only. Back up both buckets with restricted access for private files, retaining object paths and metadata consistent with the DB snapshot. Preserve original repository assets too. Restore first into a new isolated project, restore bytes and required Auth/allowlist state, then test private-byte denials, login, CMS, publication and cache expiry. A backup is not verified until that drill succeeds. [Supabase backup documentation](https://supabase.com/docs/guides/platform/backups) describes coverage and restore constraints; no backup/restore drill has been executed against hosted data.

For a bad application release, roll back the app only if compatible with the current DB schema, then purge stale data cache and verify published pages. Prefer forward-fix migrations for DB problems. Database restore is destructive and can lose newer edits; requires owner approval and a planned maintenance window. For compromised owner access, remove its UUID allowlist row, revoke provider sessions and use the provider's recovery process; review audit logs and exposed public bytes. Keep runtime free of operator credentials. Update dependencies deliberately, run audit/checks, and recheck Next/Supabase policy/API guidance before upgrades.

## Hosted acceptance checklist (not executed locally)

- [ ] New owner account can log in/out/recover; global signup denied; non-admin cannot load protected data or submit privileged requests. Provider rate limits/monitoring and operator MFA configured.
- [ ] Anonymous requests cannot read draft/hidden/private records or Storage bytes, cannot write content; existing project policies/grants reviewed. Check through actual API credentials, not only hidden UI.
- [ ] Real HTTPS hostname preserves Host/forwarded scheme; cookies HTTP-only/Secure/Lax; cross-origin action/upload rejection works. CSP nonces change per response, theme and deferred scripts hydrate, no CSP/console errors, private HTML/RSC never CDN-cached.
- [ ] Create a test draft, preview privately, publish/rename/unpublish/archive/delete, verify home/detail/sitemap metadata and old slug404. Repeat across replicas if applicable. Check all structured collections, section order, public flags and labels.
- [ ] Upload valid/invalid raster/PDF, verify private denial, explicit public copy, selected-image replacement and referenced-delete failure; delete only authorized test objects. Confirm attachment/no-store headers and file limits. Do not treat format-checked PDF as sanitized.
- [ ] Review historical content and externally unavailable URLs in QA; no unintended personal facts published. Resume/social/contact links resolve; contact has no form or delivery promise.
- [ ] Keyboard/mobile/reduced-motion/no-WebGL flows and 404/error recovery work. Run Lighthouse on actual edge and test a mid-range physical phone; local simulated scores are not field Core Web Vitals.
- [ ] Correct owner-edited title/description/icon/social image/canonical, sitemap only published routes, admin/auth noindex. Verify robots after a content/configuration outage has recovered.
- [ ] Backup DB **and** Storage bytes; complete isolated restore drill with migration/allowlist/Auth checks and documented retention/recovery owner.

## Troubleshooting

| Symptom | Check / safe action |
| --- | --- |
| Safe public error/HTTP500 | Check environment names/project reachability/migrations and redacted server group/code. Remove production seed flag; never substitute fixture content. |
| Empty content | Seed is deliberately draft/hidden. Review and explicitly publish/enable items in CMS. Check scheduled UTC publication, parent skill-group visibility and media public state. |
| Owner cannot sign in/access CMS | Enable password email provider, disable global registration, confirm invited account and exact allowlisted UUID. Email/metadata roles do not authorize. Review provider recovery flow without exposing tokens. |
| Saved edit not visible | Use CMS save, correct public flags/publication time, correct environment/canonical, tag-aware shared cache and proxy no-store. Direct SQL requires relevant CMS save/cache purge. |
| Upload403 or invalid origin | Check actual public Host/scheme and normalized forwarded headers. Fix proxy configuration; do not weaken origin or role checks. |
| Image missing | Check immutable object exists, public copy selected, asset not pending deletion, matching MIME/kind and build-time provider origin. External logo failure keeps its name. |
| Referenced delete/cleanup failure | Remove references including drafts; retry only the tombstoned unreferenced asset. Follow [media recovery](media.md), never bulk-delete Storage objects. |
| Browser script/theme failure | Check nonce propagation through proxy and fresh no-store HTML, static chunk availability, production build mode and CSP console messages. Avoid broad unsafe-inline fixes. |
