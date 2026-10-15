# Security

## Threat model

Visitors may try to enumerate drafts/private facts, forge auth state, invoke actions directly, upload active content, abuse contact storage, or exploit URL/HTML rendering and shared caches. A non-admin authenticated user must have no more write access than anonymous visitors. Admins are trusted to manage portfolio content, not SQL/code/roles.

## Planned boundaries

Supabase SSR verified auth plus immutable admin allowlist at every privileged DAL/action/upload. RLS on all exposed tables and explicit grants. Private facts/messages and admin mapping never public. Public published DTOs only. No public signup. No secret key in browser or ordinary CMS runtime. Contact intake has an optional isolated server-only secret client. No fake local persistence.

## Existing foundation

Guarded project/settings actions and SSR login/logout now exist. Baseline nosniff/frame/referrer/permissions headers configured. RLS and Storage policies have local executable checks. Uploads and contact abuse controls are implemented; CSP, live provider verification and the complete security audit remain phase gates. Legacy analytics/contact fields are not served as Next routes. `.env*` ignored except `.env.example`.

## Operational checklist

- [ ] Disable public signup; provision admin through dashboard plus immutable mapping.
- [ ] Apply/test RLS and least-privilege grants.
- [x] Verify project/settings authorization and direct project mutation replay locally (live provider pending).
- [ ] Validate URLs, text lengths and uploads server-side.
- [ ] Test draft/private metadata/cache exclusion.
- [ ] Add/test CSP and contact abuse controls.
- [x] Inspect current client chunks/diff for legacy private fields and test credentials; repeat for final release.
- [ ] Verify live Supabase Auth/Storage in a test project before production.

## Implemented Phase 2 controls

- All 17 public tables enable RLS. Anonymous writes and admin-table reads are revoked; authenticated CRUD is gated by `private.is_admin()`. No table has an anonymous INSERT path. Contact messages have no anonymous grants or public read policy.
- Admin membership is a UUID foreign key to Auth users, not email or mutable user metadata. Only operators can modify membership. The definer helper lives outside the exposed API schema with `search_path=''`; its single query uses the verified Auth UID, avoiding RLS recursion.
- Public policies require published status; skills and gallery rows also require approved parents/media. Private facts are denied until explicitly marked public. No views/RPCs expose private rows. A service-only intake RPC stores bounded messages.
- SSR server helpers are guarded with `server-only`. Public readers use a cookie-free client; session/admin data is never globally cached. Verified `getUser()` plus allowlist lookup forms the admin guard; it will be invoked independently at privileged entry points in Phase 4/5.
- Proxy refresh uses `getClaims()`, mirrors cookies onto both request and response, forwards SDK response cache headers, and sets private/no-store/noindex. It touches admin/auth only. Browser SSR integration uses standard Supabase-readable cookies; forcing HTTP-only cookies would break the documented browser integration. Production cookies are secure; sameSite is lax. CSP remains Phase 7.
- Storage writes/deletes/metadata reads are admin-only for portfolio buckets. Public bucket downloads intentionally bypass object read policies; confidential uploads must use the private bucket. Server upload validation and RESTRICT references protect cleanup.
- Repeatable imports never overwrite existing edits and keep private fields outside public settings. Generated seed JSON is server/tooling material; never import it into a Client Component or copy it into `public/`.

Executable policy coverage: `npm run test:db`, real PostgreSQL grants/RLS for anonymous, non-admin and admin; published/draft/archive exclusion; private facts/messages; inability to grant oneself admin; storage policies; slug/URL constraints; safe seed rerun. Platform Auth and Storage service behavior is an explicit outstanding external check.

## Implemented Phase 4 controls

Login uses Supabase signInWithPassword and a subsequent verified Auth-user/allowlist check. Non-admin sign-in clears its local session and returns the same non-sensitive account error as failed credentials. Provider rate-limit errors receive explicit retry feedback; production Auth rate-limit/password/signup controls still need operator configuration. Logout verifies the owner when possible, then clears only this browser's session (including expired/non-admin sessions); it never changes content or another user's sessions. Cookie SameSite/Secure options are consistent across server, browser and refresh clients. No custom application password/token system is used.

Private page/DAL reads redirect on authorization failure. Project/settings writes and deletion always verify membership independently inside their privileged DAL entry points, including when called by directly replayed Server Action requests. Layout visibility is not their permission boundary. Inputs are explicitly selected, parsed with strict schemas, bounded and mapped to known columns. Unknown role/admin properties cannot be assigned. Image references must belong to the inventory catalog or registered public raster assets. Project covers require descriptive text. Plain text descriptions remain escaped React text, including script-like input; no HTML renderer is used.

Version comparisons protect against accidental stale overwrites. Deletes require the exact current title and revision. Project deletion removes gallery rows through the existing FK but does not delete media files. Private previews have the same authorization/no-store/noindex boundaries as editing. `PORTFOLIO_DEMO_MODE` in development denies owner reads/writes; production ignores the seed flag. No mock auth or database fixture is reachable through production app routes.

`npm run test:cms` covers successful and failed login, non-admin denial despite admin-like metadata, project lifecycle/publication, protected preview, settings persistence/stale rejection, unsaved navigation/logout, escaped script text, and direct Server Action replay without authentication, with a non-admin token and after session revocation. Replayed attempts leave database counts unchanged. Tests use simulated Auth and actual RLS; live provider cookie refresh/revocation remains outstanding. No live project writes were performed.

## Phase 5 boundaries

Collection actions independently authenticate and authorize, then validate an allowlisted entity/schema with bounded strings, order, enum/icon identifiers, safe URLs, email/phone values and UUID relationships. Immutable revisions prevent stale writes/deletes. Gallery rows inherit the project publication and public image approval. Section display toggles are explicitly presentation controls; unpublish content to withdraw API reads. Facts are private by default. No raw HTML is rendered.

Upload size is capped at 3 MiB (Server Action envelope 4 MiB). Only PNG/JPEG/WebP/PDF with matching extensions/MIME are accepted; raster decoding must agree with MIME, reject animations/large dimensions, and produce a new stripped WebP at up to 2048 pixels. SVG/HTML are denied. PDFs receive format checks, not antivirus/content sanitization; only trusted owners can upload, and Storage serves them on the provider origin. Object keys are generated and immutable; no user path/filename is trusted. Public opt-in means URL accessibility independently of draft status. Private assets cannot be selected for public content and use short signed owner downloads. RESTRICT FKs protect shared references, including settings/certifications/education/resume. Deletion has a safe metadata-first cleanup sequence with explicit failure/restoration handling.

`SUPABASE_SECRET_KEY` is optional and confined to server-only `lib/dal/contact.ts`, with no session/cookie mixing. Secret keys bypass RLS, so this capability accepts only strict contact fields and calls one narrow service-only security-invoker RPC. Anon/authenticated cannot invoke it or insert/read messages. Both SQL and server checks enforce enabled intake and validation. Atomic rate counters, a honeypot and honest failure responses mitigate abuse. Vercel IP headers are trusted only when VERCEL=1; elsewhere all submissions share the conservative hourly bucket. Hashing avoids raw-IP retention. Provider outages never produce a stored/sent success. Inbox mutations use ordinary owner RLS, never the secret key.

Local tests cover real PostgreSQL grants/RLS, contact RPC permissions/rate/toggle behavior, upload decoding, anonymous/non-admin action invocations, private downloads and referenced-asset removal. Final compiled secret/private-data scan, CSP and live provider test-project checks are still required.
