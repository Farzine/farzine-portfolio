# Supabase setup and policy verification

No hosted project has been configured or modified. Migrations are source-controlled in `supabase/migrations/`; schema types were generated from those migrations using official CLI 2.121.0. The local policy harness uses real PostgreSQL 17 with minimal `auth.uid`, `auth.users`, buckets/objects contracts. It verifies SQL/RLS/grants but does not verify provider HTTP behavior, signed uploads or Auth cookie round trips.

## Owner project bootstrap (manual; never paste keys in chat)

1. Create a Supabase project. Disable public signups in Auth settings; local config already disables them. Configure site/redirect URLs for your actual deployment. Use provider password/rate-limit settings and enable bot protection if login abuse warrants it.
2. Put `NEXT_PUBLIC_SUPABASE_URL` and the **publishable** key in `.env.local` / hosting environment. Legacy anon JWT keys are accepted; secret/service-role keys are rejected. The app does not require a service-role key. Real credentials never enter Git.
3. Review migrations/seed, backup any existing database, then apply pending migrations with the Supabase CLI or Dashboard SQL editor in a new **test** project first. `npx supabase db push --linked` applies to a linked remote; do not run against production until the owner explicitly authorizes it. Never apply `supabase/tests/provider-fixture.sql` to a real Supabase project.
4. Review `supabase/seed.sql`, then run it once in the test project's SQL editor. It may be rerun: deterministic IDs + `ON CONFLICT DO NOTHING` preserve owner edits. All 15 projects are drafts; other imported collections and all personal facts default invisible. Structural sections/navigation are visible; source identity/biography/settings are public. Legacy display assets were already public and remain so. Existing media filenames, dates, claims and wording are preserved; publish individual entries after owner review.
5. Create/invite the owner in Dashboard → Authentication → Users. Set a strong password using the provider flow. Copy their stable user UUID, then as database owner run:

```sql
insert into private.admin_users (user_id)
values ('OWNER_AUTH_USER_UUID') on conflict do nothing;
```

Only DB operators can edit the allowlist. Email and user-editable metadata never grant access. Remove the UUID row to revoke application authorization; revoke provider sessions too when access is compromised. No public bootstrap or signup endpoint exists. Login/logout UI arrives in Phase 4.

## Model / public boundaries

- Public settings contain public fields only. Sensitive birthday, phone, city/address and emails are separate `profile_facts` with explicit visibility and placement. Private provenance is `private.import_provenance` and not accessible via API roles.
- Core tables: site_settings, section_settings, profile_facts, projects, project_media, experiences, education, certifications, achievements, skill_groups, skills, interests, social_links, document_links, navigation_items, media_assets. All have RLS and creation/update timestamps. Projects have unique constrained slugs, draft/published/archived states and explicit publication timestamps. Text date labels avoid invented precision.
- `anon` gets SELECT only, constrained to visible rows / published due content. `authenticated` gets content mutation grants, but RLS only permits UUID-allowlisted admins. Non-admin sessions retain public reads only. Admin helper is stable/security-definer with fixed empty search_path, no recursive role policy; no anonymous execution grant. Public schema CREATE revoked for API roles.
- Settings have a controlled singleton row. Skills additionally require a visible group; gallery entries require a due published project and public media. Section visibility controls display, not secrecy of a separately published item; use item visibility/status to withdraw public data.
- FK restrictions prevent deleting media metadata while referenced. Referenced file byte deletion and replacements will additionally be guarded in Phase 5's authorized DAL.

## Storage

Migration creates `portfolio-public` (public delivery) and `portfolio-private` (private) with a 10 MiB provider limit and raster/PDF MIME allowlist. API policies permit only admins to write/delete in these buckets, with generated UUID/UUID.extension paths; no SVG/HTML uploads. Public bucket bytes are public independent of row/draft status. Upload drafts privately; explicit promotion/copy is required for publication. The actual upload handler in Phase 5 must validate file bytes, MIME, size and extension server-side; database/Storage metadata policies alone do not validate bytes.

`media_assets` holds metadata and FK references; original assets retain `/assets/img/...` references, no redundant Storage upload required. Trusted source skill logos retain external URLs; owner-uploaded SVG remains rejected. Policies are additive: if applying to an existing project, review existing Storage/table grants/policies for broader access. Do not assume migration policies override old permissive ones.

## Reproduce local SQL/RLS gate

Requires Docker. This creates a **new disposable container**, bound to loopback; its password is a public test fixture, never a production credential.

```sh
docker run --detach --rm --name farzine-portfolio-phase2-db \
  --publish 127.0.0.1:54329:5432 \
  --env POSTGRES_PASSWORD=local-policy-test-only postgres:17-alpine
npm run test:db
```

Wait for PostgreSQL readiness if the first call is too early. The script only addresses that reserved container and verifies its test marker environment. It installs minimal provider fixtures and migrations in a fresh DB, reruns seed safely, then asserts anon/non-admin/admin read/write behavior, forged metadata denial, draft/archive/scheduled/private filtering, public/private Storage access, owner edits surviving reseed, slug uniqueness and unsafe URL/null-object constraints. Assertions roll back. It must never be pointed at a hosted DB.

```sh
PORTFOLIO_TYPES_DB_URL='postgresql://postgres:local-policy-test-only@127.0.0.1:54329/postgres?sslmode=disable' npm run db:types
# Remove only the container created above when finished:
docker stop farzine-portfolio-phase2-db
```

Type generation reads the migrated local schema with official Supabase CLI; the script preserves existing output on failure. Loopback test Postgres has no TLS; hosted URLs should retain verified TLS. `PORTFOLIO_TYPES_DB_URL` is tooling-only and is never public. Check the resulting diff; a TS compile-time contract validates seed insert shapes. Re-import source only deliberately with `CHROME_PATH=/usr/bin/google-chrome npm run seed:import` (or Playwright Chromium installed); it aborts all external HTTP loads and disables scripts.

For full provider verification use `npx supabase start` (Docker; downloads the full stack) with the committed config, then `npx supabase db reset` **only against its disposable local stack**. This is separate from the lightweight harness. Configure its local URL/publishable key through environment. Auth login/refresh/logout, Data API and Storage HTTP success/failure tests are still required in phases 4/5/8 or a test project. No hosted credentials are needed for the existing SQL gate.

## Full local Data API verification (Phase 3)

The committed `supabase/config.toml` starts successfully with `npx supabase start`; migrations and seed applied against the real local provider schemas. `npm run test:fixtures:local` targets only the fixed container `supabase_db_farzine-portfolio-v3`: it publishes historical imports for rendering tests, leaves personal facts hidden and adds a private synthetic canary for leak/404 tests. It does not alter the committed draft seed. Treat this as disposable test data, not owner content; do not run fixtures on a valued development stack.

`npm run dev:local`, `build:local`, and `test:e2e:local` obtain only the loopback URL/publishable key from CLI status and pass them to a child process without printing/writing them. The real anonymous Data API gate now passes public read, private draft/fact exclusion and denied inserts. This improves on the lightweight SQL harness; Auth browser sessions and Storage byte workflows still need Phase 4/5 tests. Stop only this project's local stack with `npx supabase stop` when finished (keeps local data by default); CI discards its disposable stack.

## Email-provider configuration and local owner tests

Keep `[auth].enable_signup=false` globally. Set `[auth.email].enable_signup=true`: despite the name, this enables the email provider including password sign-in. Setting it false prevents existing invited users from signing in (`email_provider_disabled`). See [provider configuration clarification](https://github.com/supabase/supabase/issues/40582). The actual local HTTP gate must verify `signUp` fails with `signup_disabled` while provisioned users can sign in. Hosted Dashboard settings have separate provider/registration controls; enable email authentication and disable new-user registration there. Restart only the owned local stack with `npx supabase stop` then `npx supabase start` after config changes; do not use reset or discard volumes to update Auth configuration.

Phase 4 fixtures additionally create two dedicated confirmed `.invalid` users without sending email, allowlisting only one UUID. This is a separate controlled provider-admin script and never an app capability. Do not copy fixture passwords into production accounts. [Owner workflow](admin.md) covers editing, sign-out semantics and local tests. Provision real owners through Dashboard/invite as above; no public signup is needed.
