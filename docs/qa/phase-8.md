# Phase 8 — final local acceptance

2026-10-15; Linux, Node22.22.0/npm10.9.4, Next16.4.1/React19.3.1, Chrome152/Playwright1.64.1, local Supabase54321/54322 and separate PostgreSQL policy harness54329. No hosted project, production schema, push or deployment changed. Phases0–7 evidence remains in the phase plan and QA documents.

## Final checks

| Command | Observed result |
| --- | --- |
| `npm install --save-dev --save-exact @axe-core/playwright@4.13.0` | Succeeded; only two development packages added, no runtime dependency. |
| `npm run lint` / `npm run format:check` | Pass, 115 files, no diagnostics/rule exceptions. |
| `npm run typecheck` | Pass, generated Next route types + strict tsc. |
| `npm test` | 22 named tests pass, none skipped. Includes exact source-glyph coverage. |
| `npm run test:db` | Pass, roles/drafts/private/scheduled/Storage/seed constraints and both two-session media reference/tombstone races. No new migration required. |
| `npm run build:local` | Final build pass; all public/admin/metadata/404 routes dynamic, Proxy emitted. No TS/lint bypass. |
| `CHROME_PATH=/usr/bin/google-chrome npm run test:e2e:local` | **57 public pass (40.3s), nine actual admin workflows pass (31.6s): 66 total**, zero skips/failures on final source. |
| `CHROME_PATH=/usr/bin/google-chrome npm run test:production-boundary` | Final build pass: forbidden production seed HTTP500, safe browser recovery and no seed/private output. |
| `npm run test:security` | Pass: 690 reachable Git blobs, current nonignored files, 16 client chunks, 34 Data Cache entries (867 text checks at this checkpoint), shallow=false. Known secret/private markers absent; ignored env files not read. Counts may grow as QA artifacts/commit are added. |
| `npm audit --audit-level=moderate` | Zero reported vulnerabilities after the axe installation. |
| `CHROME_PATH=/usr/bin/google-chrome npm run audit:performance` | Four actual Lighthouse13.5.0 navigations, mobile/desktop home and published project; [final summary](phase-8/lighthouse-summary.json), [before icon subset](phase-8/lighthouse-baseline.json). No fabricated scores; final performance93/95 mobile,100/100 desktop, other categories100. |
| `npm run audit:links` | 69 historical URLs checked read-only: 62 reachable, four404 and three owner-browser review cases. [Full results](phase-8/legacy-links.json). No source/CMS URLs silently changed. |
| `git diff --check` | Pass. |
| `git diff --quiet 6d774c7050fda2ab386fa4dfe297d4a4f4776715 -- index.html assets projects` | Exit0: original HTML/content/assets preserved. |

## Accessibility and visual review

Default axe-core rules run without exclusions/disabled rules on home, all seven sections, open project dialog, project listing/detail, 404 and login in **both themes at all three viewports**. Actual authenticated overview/settings/new project/expanded experience and section forms/media are scanned at1440px and390px, plus server validation error feedback. Zero automatically detected violations in those tested states; this is not a complete WCAG certification or human screen-reader assessment. Existing keyboard focus/Escape/dialog return, mobile menu, no-JS, reduced motion, saved/pre-paint themes, blocked storage, WebGL failure/render/disposal and320px overflow regressions all pass.

Audit fixes: exact title-repeating certificate alt becomes decorative while distinct owner descriptions remain; static/touch/no-cover certificate captions use theme text on theme surface. Overlay/geometry/assets remain. Initial audit-only status ambiguity and streamed heading timing were fixed with correct locators/readiness checks; no product rule was weakened. Expected malicious-Origin action rejection logs are intentional security evidence, not a normal user error.

Final screenshot inspection and [reference crop measurements](phase-8/visual-comparison.json) retain source identity/navigation raw pixel error0; social/date mean channel error0.0055/255. This excludes changing typing text/theme control and does not claim whole-page pixel equivalence. Existing [Phase6 captures](phase-6/) document all palettes/geometry; final browser suite captures states under ignored test-results. All intentional deviations remain in [design preservation](../design-preservation.md).

## Performance evidence and limits

Lighthouse runs sequentially against an exclusively owned production server3103 with warm server Data Cache, fresh browser storage, simulated mobile RTT150ms/1.6Mbps/4×CPU and desktop preset. Initial sample: home/project performance94/97 mobile and100/100 desktop; accessibility/best-practices/SEO100 in all four. This is a lab observation, not field Core Web Vitals or a physical mid-range phone.

The measured two legacy icon stylesheets plus main CSS used three blocking requests/32148 transfer bytes; the exact25-glyph subset bundles the same original fonts/glyphs with Next CSS, reducing to one request/about6758 bytes in the first post-subset sample. No font/image/geometry redesign. A source contract test prevents missing/wrong glyphs when component choices change. Single-run mobile home scores varied93–94 and project95–97 despite the transfer reduction; no score gain is inferred from that change. Final exact scores/timings/transfer totals are in the linked timestamped summary. All final accessibility/best-practices/SEO scores are recorded there.

Final simulated sample (all accessibility/best-practices/SEO100, no runtime warnings):

| Route / mode | Performance | FCP | LCP | TBT | CLS |
| --- | --- | --- | --- | --- | --- |
| Home / mobile | 93 | 2.26s | 2.86s | 39ms | 0.00180 |
| Project / mobile | 95 | 1.66s | 2.79s | 20.5ms | 0 |
| Home / desktop | 100 | 0.52s | 0.69s | 0ms | 0.00326 |
| Project / desktop | 100 | 0.41s | 0.58s | 0ms | 0.00109 |

Final CSS transfer6756B/one request; total navigation400–445KB including fonts/images/scripts. Simulated mobile LCP remains above the2.5s goal, so hosted font/network-chain and physical-phone measurement remains an explicit follow-up; no field-CWV pass is claimed.

Remaining suggestions are primarily framework hydration/compatibility JS, font/network dependency chains and deliberate no-store back/forward-cache tradeoffs. Avoid removing CSS needed by hidden sections just because a home-only audit calls it unused. Project-gallery content remains server rendered; the Three engine never loads on initial/mobile/reduced-motion visits, and actual GPU draw/disposal is tested on this capable desktop. No texture/postprocessing/continuous idle loop. Hosted latency/shared-cache/CDN and physical-phone profiling remain deployment checks; no numeric field score is claimed.

## Content and operational acceptance

Four original URLs returned404: FarmAI GitHub repository and the three Kaggle leaderboard URLs. Codeforces/SUST returned403 and LinkedIn999 to automation; these need an owner browser, not an invented replacement link. All remain preserved editable historical draft/hidden seed content; review before publication. All30 external skill-logo URLs responded successfully in this run, with pending/failure text fallback independently tested. Resume/contact links are real editable URLs, not a message form; no mail/storage success is falsely claimed.

- [x] Every source section/project/used asset is mapped; source originals remain; no fabricated claims/metrics.
- [x] All modeled content, visibility/order, public labels, site identity/SEO/resume/contact/socials and media have protected structured CMS workflows.
- [x] Real local auth/refresh/logout, UUID authorization, direct anonymous/non-admin action denial and closed signup tested.
- [x] Actual CMS create/edit/publish/rename/unpublish/archive/delete, validation/stale conflicts, precise cache expiry and public/private isolation tested.
- [x] Raster/PDF valid/invalid upload, private access, public copy, reference-safe delete and cleanup retry tested through actual local provider.
- [x] Dark default/light persistence, visual preservation, responsive/keyboard/no-JS/reduced-motion and optional WebGL checks pass.
- [x] Nonce CSP/security headers/JSON-LD/sitemap/robots, URL validation and known secret/client/cache scans pass locally.
- [x] Fresh developer instructions, first admin, migrations/seed/Storage, cache/proxy, backups/restore/rollback/troubleshooting and explicit hosted checklist documented.
- [x] New README.md replaces old Readme.md with the owner's explicit permission, avoiding case-insensitive filename collision. No unrelated file silently consumed.
- [ ] Hosted owner/bootstrap/recovery/rate-limit/CDN/TLS/Storage/cache deployment checks: unavailable credentials/authorization; exact [manual gate](../deployment.md#hosted-acceptance-checklist-not-executed-locally).
- [ ] Physical phone, real screen reader/inclusive user testing and hosted/field measurements: no such device/deployment available; run before production signoff.
- [ ] Hosted database **and Storage bytes** backup/isolated restore drill: documented, not executed; requires operator access and approval.

Known limits: owner password recovery is operator-managed, with no invitation/reset callback UI. Browser SPA Back/Forward cannot guarantee the native unsaved-change prompt; save before history navigation. PDFs are format checked, not sanitized. Storage-success/metadata-registration-failure orphan is handled honestly but not fault-injected; operator recovery is documented. Direct SQL edits do not notify Next tags; multiple self-hosted replicas need a shared tag-aware cache. Previously public Storage bytes/history cannot become confidential through a row visibility flag. [Security](../security.md), [media](../media.md), [architecture](../architecture.md) and [deployment](../deployment.md) describe these boundaries.

Local implementation gate passes with the external checks explicitly outstanding. No unconditional production-ready/fully-secure/fully-tested claim is made. Next action is owner configuration/content review and the authorized staging checklist, not an automatic deployment.
