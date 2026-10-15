# Phase 3 public migration evidence

2026-10-15; Node 22.22.0, Next 16.4.1/React 19.3.1, Chrome 152 via Playwright 1.64.1 on this Linux host. Real full local Supabase stack initialized with the committed migration/seed; a separate explicit local rendering fixture publishes historical items for verification. No hosted database, push or deployment used.

| Check | Observed result |
| --- | --- |
| `npm run lint` | Passed, no diagnostics |
| `npm run format:check` | Passed |
| `npm run typecheck` | Passed (next typegen + strict tsc) |
| `npm test` outside sandbox | 9 named tests passed: source identity/seed preservation, public DTO projection/visibility/media/link safety, duplicate text keys, config/production guard, source/preview-preserving asset sync |
| `npm run test:db` | Passed: real PostgreSQL role/RLS/grant/constraint tests plus repeatable seed and owner-edit preservation; lightweight provider fixtures explicitly separate from full stack |
| `npm run build:local` | Passed; `/`, `/projects`, `/projects/[slug]` dynamic server routes; static not-found; admin/auth Proxy |
| `npm run test:production-boundary` | Passed: production seed flag returns HTTP 500, no private/seed output, hydrated browser recovery heading/button visible; owned test server stopped |
| `CHROME_PATH=/usr/bin/google-chrome npm run test:e2e:local` | 27/27 passed in 10.9s on final build; desktop/tablet/mobile |
| `git diff --quiet 6d774c7 -- index.html assets projects` | Exit 0: source unchanged |
| `git diff --check` | Passed |

Browser coverage: real DB-backed identity/navigation and all seven sections; 15 project/9 certificate/8 interest/4 skill-group counts; local images loaded after scrolling lazy images into view; no horizontal overflow at 1440×900, 768×1024, 390×844; no uncaught page errors. All/Web/App filtering, keyboard-opened native dialog, Escape/focus return, canonical detail route/metadata, real missing/private 404s and legacy detail redirects, retired preview 404, no-JS section/filter/detail flows, reduced-motion transitions and mobile keyboard menu dismissal. Actual anonymous Data API returns 15 public projects and zero private facts, excludes the private synthetic draft canary and denies inserts. No invented public test project is rendered.

Representative unedited captures in [phase-3/](phase-3/): desktop introduction/About/projects/education; mobile introduction/About/projects; tablet skills. Source baselines remain in [reference/](../reference/). Desktop introduction/About/grid and mobile layouts were visually inspected against those references; no numerical pixel-parity score claimed. Resting section captures clear programmatic heading focus and disable transition animation. Private facts intentionally absent; image optimization, touch captions and other justified changes are recorded in [design preservation](../design-preservation.md).

Failures resolved before gate: a cold optimized-image race in the old smoke test (now waits for image completion); below-fold lazy images correctly deferred on mobile (test now scrolls before checking); mobile home-extra rule overriding compact-header hiding; metadata exception bypassing recovery (now safe noindex fallback while body error boundary handles failure). No lint/type rules disabled.

Remaining scope: owner login/logout/session/action-bypass verification and CMS (Phase 4), real upload/private signed file workflows (5), exact final parity/light theme/Three.js and measured performance (6), shared cache/security/CSP/SEO audit (7), full accessibility/Lighthouse/external-link/device review and deployment handoff (8). External source skill logos retain text fallback; exhaustive external network reachability was not claimed. CI definition updated for full local integration but has not been run remotely because no push is authorized. Unattributed `Readme.md` deletion is preserved outside this phase commit; ignored existing `.env.local` is untouched.
