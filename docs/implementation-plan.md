# Migration plan

Preserve the checked-out `main` design at base `6d774c7`. See [design preservation](design-preservation.md), [inventory](content-inventory.md), and [architecture](architecture.md). No pushes/deployments authorized. Use one conventional commit per passed phase; never amend a prior phase. Update CONTEXT before each checkpoint; record the resulting hash there in the next working update (a commit cannot contain its own hash).

| Phase | Status | Complete vertical slice / acceptance gate |
| --- | --- | --- |
| 0 | passed | Git safeguards; all HTML/assets/links inventoried; local/live desktop/mobile references; documented design/architecture, phases and next task. Run inventory self-check, compare source/live section text, review diff. |
| 1 | passed | Next App Router, strict TS, quality commands/CI, fonts/tokens, safe legacy preview, errors/404, setup/env example. Install + lint + format + typecheck + tests + build + desktop/mobile smoke. Legacy remains intact. |
| 2 | passed (local SQL; provider HTTP pending) | Normalized Supabase migrations, repeatable provenance-aware seed, DB types, SSR helpers, admin allowlist, RLS/storage. Apply to isolated local DB; test anon/non-admin/admin and draft deny/allow; verify seed repeatability; never run against production without authorization. |
| 3 | passed locally | Server-rendered public content through DAL; preserve section-switch layout/order/cards and detail URLs. Explicit opt-in local seed mode; production fails safely on missing DB. Full inventory mapping, desktop/tablet/mobile/keyboard/404/image checks + standard checks. |
| 4 | passed locally | Supabase login/logout/refresh; requireAdmin in every privileged entry point; dashboard, settings and complete project CRUD. Direct unauthorized mutation tests + valid/invalid write/publish/cache path + standard checks. |
| 5 | passed locally | Structured forms for remaining collections, section/navigation visibility/order, private personal fields, media library, safe upload/reference-aware deletion. Keep contact as real editable contact links unless storage form is justified. CRUD success/failure/media tests + standard checks. |
| 6 | not_started | Compare screenshots; dark default/light palette toggle with persistence; small optional lazy WebGL accent within existing component bounds. No layout addition. Reduced motion, no JS/WebGL, offscreen/hidden cleanup, mobile overflow, contrast, bundle/performance evidence + standard checks. |
| 7 | not_started | Public cache tags + precise invalidation, auth/private cache isolation, CSP/headers, URL/input/policy audit, sitemap/robots/metadata. Security tests + write/invalidate/read + bundle secret scan + standard checks. |
| 8 | not_started | Full auth/CRUD/media success/failure workflows, public keyboard/responsive/no-motion/404 tests; measured audits if available; README/deployment/security handoff. Full checks pass or external limitations have exact manual verification instructions. |

## Execution

Read CONTEXT, plan, relevant docs and Git status before each phase. Plan a small complete slice; implement; run checks; inspect full diff and `git diff --check`; stage named phase files only; commit only when gate evidence is recorded. Critical failing build/security checks stop phase progression until fixed. External credentials are not needed for local planning/builds; local DB/browser verification should be attempted. No fake persistence or delivery.

## Dependencies and test strategy

Node 22/npm lockfile. Use stable versions verified from npm and official docs, not restored placeholder `node_modules`. Node test runner through tsx for pure logic; Playwright for browser workflows; SQL tests in disposable Postgres/Supabase-compatible harness and real Supabase integration when configured. RLS tests must exercise roles/JWT identities, not merely inspect SQL strings. Build/lint/typecheck/format run independently. Add integration coverage as each trust boundary arrives. Use direct Three.js (no R3F/Drei unless evidence requires them) to avoid an extra framework for one small effect.

## Risks / conservative defaults

- Legacy source includes sensitive personal fields. Import to admin-only data; visibility false until explicitly published. Existing public email/social links have explicit per-field publishing controls.
- Claims and dates are source snapshots, not verified current facts. Keep wording and provenance; no inferred career updates.
- Preserve all 15 projects including misleading DP-Learning `vdg.jpg`; owner may replace it in CMS.
- Missing links become plain text/disabled actions; existing bad favicon/script paths are not migrated.
- Legacy template license attribution must be preserved; owner should confirm rights to legacy/vendor assets before public deployment.
- No production project/environment credentials assumed. No service-role key needed for normal app reads/writes; use verified session and RLS.
