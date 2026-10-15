# Security notes (migration in progress)

Threats: anonymous/non-admin writes, draft/private content reads, forged sessions/roles, unsafe links/HTML/uploads, destructive media removal, contact abuse and shared-cache session leaks. Never treat route hiding as authorization.

Phase 1 has no auth, database, upload or contact endpoint. It only serves a static foundation and preserved noindex legacy preview. Baseline `nosniff`, same-origin framing and strict-origin referrer headers are configured. Complete CSP, admin protection, RLS/storage policies and executable authorization tests arrive in phases 2/4/5/7. Do not claim completed application security or deploy the interim preview as the finished migration.

Environment variable **names only**: `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `PORTFOLIO_USE_DEV_SEED`. Publishable key is not an admin credential; RLS must enforce reads/writes. No service-role key needed/planned for normal requests. `.env*` is ignored except safe `.env.example`.

Planned controls: verified Supabase identity + server-controlled UUID allowlist; requireAdmin per privileged action and DAL method; no self-service signup; narrow DTOs and explicit public columns; plain text/validated URLs; reject executable uploads; public/private Storage separation and reference-aware deletion; private/no-store admin/session responses; targeted public cache invalidation. See [architecture](architecture.md). First-admin operational provisioning and policy execution evidence will be recorded when implemented.

Checklist pending: anon/non-admin/admin RLS tests; draft/private media leakage tests; auth expiry/logout; direct action bypass; URL/HTML/upload malicious payloads; public cache isolation; browser CSP; secret scan of Git and browser chunks; production provider abuse settings; independent owner access review before deployment.
