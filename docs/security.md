# Security notes (migration in progress)

Threats: anonymous/non-admin writes, draft/private content reads, forged sessions/roles, unsafe links/HTML/uploads, destructive media removal, contact abuse and shared-cache session leaks. Route hiding is never authorization. No hosted project was configured or modified.

## Implemented through Phase 3

- Every exposed content table has RLS, explicit grants and separate public-read/admin-write policies. Private UUID allowlist/provenance have no API-role table grants. `is_admin()` has fixed search_path, stable security-definer execution, authenticated-only execution and no recursive role policy. User-editable metadata/email confer no role.
- Published due projects only; private/draft/archive/future and hidden personal facts denied to anon/non-admin. Gallery requires public asset and published project. Skills require visible group. Section visibility is a display control; revoke item visibility/status to withdraw data.
- Versioned migration and non-destructive seed; historical projects draft and private fields invisible. Pure safe URL DB checks, unique slugs, publish timestamps, media-path/size/MIME constraints and restrictive FKs. No arbitrary HTML/SQL editing.
- Separate **server-only** public anonymous client (no session persistence) and SSR session client. `requireAdmin` verifies signed claims then calls UUID-role predicate for each privileged operation; never shared-cache authorization. No service-role key. Client browser bundles do not import the historical seed or auth/DAL modules.
- Auth is intentionally server-managed via future Server Actions: SSR cookies HTTP-only, Secure in production, SameSite=Lax. No browser auth client is installed because JS need not read tokens. This differs from the optional browser-session example in provider docs and preserves HTTP-only cookies. Future OAuth/PKCE features must account for this choice; do not mix a cookie-reading browser auth client into this flow.
- Next 16 `proxy.ts` refreshes cookies on admin/auth paths only, forwarding provider cookie/cache headers. Admin paths get private/no-store + noindex. Server Components cannot write cookies; actions use `writeCookies: true`. Proxy does not replace `requireAdmin` at every mutation/privileged DAL boundary. Login/logout/action integration still Phase 4.
- Storage buckets: public display and private draft, admin-only writes; generated UUID paths and raster/PDF metadata limits. Public bucket bytes are always public; private assets require signed admin reads and explicit promotion. Server file-byte validation/reference-safe removal still Phase 5.
- Baseline nosniff/same-origin framing/referrer headers, noindex legacy preview. `.env*` ignored except safe example. Public config rejects secret/service keys and unsafe URLs without echoing values. Explicit seed mode allowed only development/test; no fake persisted writes.

## Verification and operational setup

[Supabase setup](supabase.md) documents bootstrap, exact local tests, provider fixture limitations and hosted checklist. Real PostgreSQL role/RLS assertions pass for anon/non-admin/admin, self-promotion denial, private/draft/scheduled isolation, storage path/role boundaries, invalid URLs/slugs/media and seed repeatability. Generated types come from migrated schema; TS checks seed insert shapes. Unit tests verify environment/key/production-seed guards and source migration fidelity.

Environment names: `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `PORTFOLIO_USE_DEV_SEED`. Tooling only: `PORTFOLIO_TYPES_DB_URL`. Never store values here. Bootstrap owner via provider Dashboard user invitation and DB-owner UUID allowlist insert; public signup disabled in local config and must also be disabled in hosted Auth settings. Review provider login rate limits/password settings, MFA for operator accounts and audit logs before deployment.

## Remaining gates

No live credentials used; provider HTTP Auth refresh/login/logout, API policies and actual file delivery must be tested against full local Supabase/test project in phases 4/5/8. Server schema validation of all CMS writes, direct-action authorization bypass tests, file-byte payload tests, safe referenced replacement/removal, cache invalidation/isolation, full CSP/SEO, chunk/history secret audit and operational backup/access review remain. No contact form/endpoint exists; current contact links will be editable without pretending to send mail. The served legacy preview is now retired (404), with originals retained outside public; current public DTOs exclude private facts. Do not deploy this intermediate state as the finished migration.

Runtime visibility cannot erase personal data already present in the public legacy repository/history or existing deployment. Original source is intentionally preserved; no history rewriting or production change was authorized.

## Phase 3 verification

Full local Supabase migrations/seed applied successfully. Actual anonymous Data API reads return 15 fixture-published projects, exclude the private draft canary and personal facts, and reject project inserts. Browser tests confirm private/unknown detail routes return true 404s without metadata/body canary values. Unit tests additionally cover archive/future visibility, hidden skill groups, private gallery/media, unsafe URL/path output and explicit DTO projection. No session/client Supabase access is needed for public pages. Existing source HTML/assets/projects remain unchanged; runtime visibility cannot remove historical public repository data.

Development preview uses a server-only seed import and an explicit development/test guard; production rejects the flag with HTTP 500, redacted output and a browser recovery boundary. Valid content/navigation/filter/detail links also work without JS. No raw HTML is accepted or rendered. Next image optimization only allows the configured project's public Storage path; legacy local images retain dimensions/sizes/lazy loading. Original external logo URLs use browser-only images with accessible text fallback, not a server-side arbitrary URL proxy. Full CSP/link reachability/performance/accessibility audits remain later phases.

Full local Auth login/refresh/logout, direct CMS-action authorization and real upload/signed-file behavior are not yet verified. No hosted project was modified. A pre-existing ignored environment file was observed during Phase 3 and preserved; no values were printed or committed. The earlier temporary repository file server on 4173 was stopped to avoid serving environment files.
