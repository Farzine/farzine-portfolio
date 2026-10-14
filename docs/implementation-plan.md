# Implementation plan

Each phase begins by reading CONTEXT.md and Git status. Each phase ends with diff/security review, exact test results, updated docs and a single next task. Successful gates advance automatically. No deployment or production schema change without owner approval.

| Phase | Scope                                                                                                 | Gate                                                                                                                                | Status                                    |
| ----- | ----------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| 0     | Source discovery, inventory, provenance, architecture and design decisions                            | Inventory covers every section/project/asset/link; legacy hashes preserved; plan and next task recorded                             | passed                                    |
| 1     | Root Next App Router, strict TS, CSS tokens, shell, errors, env example, npm/CI/testing               | Install, format, lint, typecheck, unit tests, production build, desktop/mobile browser smoke                                        | passed                                    |
| 2     | Normalized Supabase migrations, draft import, types, SSR clients, admin allowlist, grants/RLS/storage | Schema applies in local Postgres or documented alternative; executable anonymous/nonadmin/admin and draft policies; seed safe twice | passed (embedded PG; live checks pending) |
| 3     | Public DAL, profile and all inventoried sections, project list/detail, images and metadata            | All mappings resolved; slug/404, responsive keyboard/reduced motion; quality suite                                                  | passed                                    |
| 4     | Login/logout, protected admin, guarded DAL/actions, settings and full project CMS                     | Direct unauthorized/nonadmin actions rejected; valid CRUD reflected publicly; invalid inputs rejected                               | not_started                               |
| 5     | Remaining CMS collections, section visibility/order, media, truthful contact storage                  | All public content editable; upload safety/reference protection; contact failure/success; CRUD regression                           | not_started                               |
| 6     | Visual refinement, isolated lazy WebGL accent and static fallback                                     | No-JS/WebGL/reduced motion/mobile usable; cleanup, console and measured performance                                                 | not_started                               |
| 7     | Tagged public caching, narrow invalidation, CSP/headers, security/SEO review                          | Write/invalidate/read; private cache exclusion; sitemap/metadata draft exclusion; malformed input/URL tests                         | not_started                               |
| 8     | Full suite, browser workflows, accessibility/performance measurements, handoff                        | All prior gates passed or explicit external verification steps; documented setup/bootstrap/backup/deployment                        | not_started                               |

## Routes and vertical slices

- `/`: ordered public profile sections.
- `/projects`, `/projects/[slug]`: published projects only, category selection through URL.
- `/admin/login`: no signup; disabled clearly without configured Supabase.
- `/admin`: overview; `/admin/settings`, `/admin/projects` and entity collection/edit routes.
- Use Server Actions for same-site forms; add route handlers only for justified binary uploads/contact boundaries.
- Keep old project filename redirects when new slugs are ready; never expose the old homepage personal data as a new route.

## Data model

Site settings and section settings; projects and project media; experiences; education; certifications; achievements; skill groups and skills; interests; social/navigation links; private profile facts with explicit public projection; media assets if needed for shared-reference safety; contact messages; immutable admin allowlist. Text is plain text/structured bullet lists, never executable HTML. Literal legacy dates remain text so uncertain dates are not silently inferred.

## Tooling and tests

Use npm, Biome lint, Prettier scoped to new files, strict tsc, Node-compatible TS unit tests, Playwright with installed Chrome. Validate SQL with executable embedded Postgres if Docker remains unavailable; explicitly distinguish this from live Supabase Auth/Storage. Highest-risk tests cover RLS/grants, direct mutation authorization, draft/private projection, URLs/uploads, cache invalidation and contact abuse. Browser test public routes, admin boundaries and mobile overflow before expanding UI. Lighthouse if install/runtime permits; never invent scores.

## Risks and deferred external checks

Legacy claims/dates are stale until owner review; all import defaults to draft. Production public release requires owner publication. No external credentials detected or requested. Live Supabase Auth/Storage and actual admin session workflows need configured test infrastructure. Contact notification delivery requires a provider; storage-only reporting is sufficient initially. No final deployment authorized.
