# Security

## Threat model

Visitors may try to enumerate drafts/private facts, forge auth state, invoke actions directly, upload active content, abuse contact storage, or exploit URL/HTML rendering and shared caches. A non-admin authenticated user must have no more write access than anonymous visitors. Admins are trusted to manage portfolio content, not SQL/code/roles.

## Planned boundaries

Supabase SSR verified auth plus immutable admin allowlist at every privileged DAL/action/upload. RLS on all exposed tables and explicit grants. Private facts/messages and admin mapping never public. Public published DTOs only. No public signup. No service-role key in browser or ordinary runtime. No fake local persistence.

## Existing foundation

No write endpoints or auth/session code yet. Baseline nosniff/frame/referrer/permissions headers configured. CSP, RLS, Storage and executable security checks are phase gates, not claimed complete. Legacy analytics/contact fields are not served as Next routes. `.env*` ignored except `.env.example`.

## Operational checklist

- [ ] Disable public signup; provision admin through dashboard plus immutable mapping.
- [ ] Apply/test RLS and least-privilege grants.
- [ ] Verify non-admin direct mutations fail.
- [ ] Validate URLs, text lengths and uploads server-side.
- [ ] Test draft/private metadata/cache exclusion.
- [ ] Add/test CSP and contact abuse controls.
- [ ] Inspect client chunks/diff for secrets.
- [ ] Verify live Supabase Auth/Storage in a test project before production.

## Implemented Phase 2 controls

- All 17 public tables enable RLS. Anonymous writes and admin-table reads are revoked; authenticated CRUD is gated by `private.is_admin()`. No table has an anonymous INSERT path. Contact messages have no anonymous grants or public read policy.
- Admin membership is a UUID foreign key to Auth users, not email or mutable user metadata. Only operators can modify membership. The definer helper lives outside the exposed API schema with `search_path=''`; its single query uses the verified Auth UID, avoiding RLS recursion.
- Public policies require published status; skills and gallery rows also require approved parents/media. Private facts are denied until explicitly marked public. No views/public RPCs expose private rows.
- SSR server helpers are guarded with `server-only`. Public readers use a cookie-free client; session/admin data is never globally cached. Verified `getUser()` plus allowlist lookup forms the admin guard; it will be invoked independently at privileged entry points in Phase 4/5.
- Proxy refresh uses `getClaims()`, mirrors cookies onto both request and response, forwards SDK response cache headers, and sets private/no-store/noindex. It touches admin/auth only. Browser SSR integration uses standard Supabase-readable cookies; forcing HTTP-only cookies would break the documented browser integration. Production cookies are secure; sameSite is lax. CSP remains Phase 7.
- Storage writes/deletes/metadata reads are admin-only for portfolio buckets. Public bucket downloads intentionally bypass object read policies; confidential uploads must use the private bucket. Server upload validation and reference-aware cleanup remain Phase 5.
- Repeatable imports never overwrite existing edits and keep private fields outside public settings. Generated seed JSON is server/tooling material; never import it into a Client Component or copy it into `public/`.

Executable policy coverage: `npm run test:db`, real PostgreSQL grants/RLS for anonymous, non-admin and admin; published/draft/archive exclusion; private facts/messages; inability to grant oneself admin; storage policies; slug/URL constraints; safe seed rerun. Platform Auth and Storage service behavior is an explicit outstanding external check.
