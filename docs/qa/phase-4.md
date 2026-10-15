# Phase 4 core admin evidence

2026-10-15, Node 22.22.0, Next 16.4.1/React 19.3.1, Chrome 152/Playwright 1.64.1, Linux. Full isolated Supabase Auth/API stack with dedicated local users; separate policy-test PostgreSQL harness. No hosted project, real emails, push or deployment.

| Command/check | Observed result |
| --- | --- |
| `npm run lint` | Passed, 72 files, no diagnostics |
| `npm run format:check` | Passed |
| `npm run typecheck` | Passed, generated route types + strict tsc |
| `npm test` with host IPC permission | 11 named assertions passed; includes settings/project schema and privileged-field/URL/list checks |
| `npm run test:db` | Passed; migrations/seed repeatability, role/RLS/read/write/draft/private/scheduled/Storage constraint regressions in disposable harness |
| `npm run build:local` | Passed after final help-text edit; all public/admin routes dynamic, static not-found, Proxy |
| `CHROME_PATH=/usr/bin/google-chrome npm run test:e2e:local` | Final owned-port 3102 run: 27 public checks passed (11.5s), then four actual admin workflows passed (10.3s) |
| `CHROME_PATH=/usr/bin/google-chrome npm run test:e2e:admin:local` | Focused rerun passed 4/4 (9.1s); final combined owned-server run also passed with screenshot/error assertions and no main-page uncaught errors |
| `npm run test:production-boundary` | Passed, production seed flag rejected with HTTP 500, safe recovery, no seed/private output |
| Client-output scan | 16 JS chunks; no dedicated Auth fixture credentials, private canary or seed provenance |
| Source/public UI preservation | `git diff --quiet 6d774c7 -- index.html assets projects` and `git diff --quiet 8b4bc2b -- app/globals.css app/page.tsx components/site components/projects components/profile assets projects index.html` exited 0 |
| `git diff --check` | Passed |

Actual provider/browser assertions cover:

- Public registration rejected (`signup_disabled`); incorrect password and non-admin login get generic failure. Real non-admin UUID with forged role/is_admin user metadata cannot open private content. Valid login/logout, session refresh after forced expiry, invalid-cookie recovery. HTTP-only/Secure/SameSite=Lax cookies inaccessible to document.cookie; private/no-store/noindex responses.
- Project creation, edits, publication, slug change and old URL 404, unpublish, archive and confirmed deletion. Invalid/duplicate slugs, missing publication timestamp, private-image publication and incorrect delete confirmation fail honestly. Editor controls cover tags/category/order/featured/SEO/link/image fields; plain script text is rendered escaped. Private saved draft preview is visible to admin and absent from anonymous responses.
- Gallery create, repeatable caption/order upsert and confirmed removal, with retained assets. Public route reload reflects saved caption and published changes. Settings validation/save and public freshness, stale settings/project write rejection, narrow 390px editing without horizontal overflow and cancel/accept unsaved link navigation.
- Exact captured action ID/body replay to every CMS action (project create/update, settings save, gallery save/remove, project delete) returns denial for anonymous and real non-admin sessions. Foreign-Origin action rejected; its expected Next.js server diagnostic is part of the negative test, not a passing mutation.

Unedited screenshots in [phase-4/](phase-4/): desktop 1440×900 overview and mobile 390×844 settings. Inspected for legibility, controls and overflow. Counts show the explicit local publication fixtures (15 source projects plus one private canary), not invented production analytics. Public UI/source remain unchanged in this phase. No full accessibility/performance score claimed.

Initial failures fixed before gate: local email-provider switch disabled password login (global signup remains closed and tested); expected authorization failures from private page reads now redirect rather than throw a logged page error; required-label selector mismatches; waiting for a complete React stream in browser action capture replaced with response plus observable state/DB assertions. The final ownership check refused an unknown server on 3000; test app moved to reserved 3102 with existing-server reuse disabled and non-local provider URLs rejected. All 31 checks passed again there. The unknown process and transient generated type-file changes were preserved. No disabled rules, skipped gate tests or fake persistence.

Known limits/next gate: remaining collection/visibility/navigation/label CMS and media byte upload/signing/reference-safe deletion (5); themes/WebGL/final parity/performance (6); shared public cache tags/invalidation, full secret/history/CSP/SEO audit and deployment abuse controls (7); full handoff/hosted verification (8). Unsaved prompts cover links/unload; browser client-history navigation remains a documented limitation. Provider logout affects this session; access JWT expiry and explicit UUID role revocation are separate. Public file bytes are not made private by hiding a DB record. Hosted Auth/SMTP/recovery/Storage were not tested. Existing ignored environment values and unrelated Readme.md deletion were preserved outside this phase commit.
