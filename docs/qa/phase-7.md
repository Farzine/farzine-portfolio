# Phase 7 — cache, security and SEO verification

Observed 2026-10-15 on Node 22.22.0, Next 16.4.1, Chrome `/usr/bin/google-chrome`, owned local Supabase API54321/DB54322 and separate PostgreSQL policy harness54329. No hosted credentials, push, deployment or production mutations. Historical fixture data is explicitly published only in the isolated local test stack.

## Changes and gate evidence

- Seventeen typed anonymous public Data Cache groups; immediate CMS tag expiry, RLS-dependent gallery/skills invalidation, no shared private/auth cache. Per-request dynamic nonced HTML/RSC, no blanket public-path eviction. Supported cache APIs and nonce integration checked against shipped Next types/docs and current official references linked in [architecture](../architecture.md) and [security](../security.md).
- Request nonce overwrites forged headers; production script CSP has no unsafe-inline/eval. Default/object/base/frame/form/font/connect/image/style permissions documented. HTTPS HSTS, DENY/nosniff/referrer/Permissions-Policy. Original source CSS, geometry, text and assets unchanged. The only public content boundary adjustment rejects PDF assets in image slots; document downloads remain supported.
- Sitemap/robots, escaped real Person/WebSite/CreativeWork JSON-LD, editable canonical settings with deployment-origin fallback. No invented accomplishments, dates, ratings, analytics or domain. Draft/private/admin data excluded; real unknown/old slug 404s remain.
- Reviewed all privileged action/DAL/route entry points, schemas, Storage/reference deletion, role grants/policies, error logs, cache boundaries and client imports. No new tables, grants, RPCs or migrations required. Existing independent guards remain intact. Auth uses enabled provider rate limits/closed registration; hosted tuning/recovery/monitoring is operational work, not a fictitious application limiter.

| Command | Observed result |
| --- | --- |
| `npm run lint` | Pass, 110 files, no diagnostics. |
| `npm run format:check` | Pass, 110 files. |
| `npm run typecheck` | Pass, Next route generation + strict tsc. |
| `npm test` | 21/21 named tests pass, no skips. Includes CSP/JSON-LD/cache allowlist and PDF/image output boundary. |
| `npm run test:db` | Pass: anon/non-admin/admin RLS, draft/private/scheduled boundaries, role self-promotion denial, Storage/ref integrity, repeatable seed and both actual concurrent media lock orders. |
| `npm run build:local` | Pass, final application source. Public/admin/robots/sitemap/404 dynamic; Proxy emitted. No rule disabled. |
| `CHROME_PATH=/usr/bin/google-chrome npm run test:e2e:local` | 51 public checks pass (25.2s), eight actual admin workflows pass (26.6s), 59 total. Desktop/tablet/mobile themes/keyboard/no-JS/reduced-motion/WebGL/404 and actual Auth/CMS/media tests run under production CSP. |
| `CHROME_PATH=/usr/bin/google-chrome npm run test:e2e:admin:local` | Final strengthened eight workflows pass (26.4s). Added sitemap publish/rename/withdraw/delete and real CMS JSON-LD script-terminator round-trip. Serial workers avoid shared-fixture mutation races. |
| `CHROME_PATH=/usr/bin/google-chrome npm run test:production-boundary` | Pass after nonce integration: forbidden production seed HTTP500, safe recovery UI, no private/seed output. |
| `node scripts/check-security.mjs --self-test` | Pass: known secret/public token handling, service-role JWT recognition, long non-token input. Scanner uses bounded/prefixed JWT candidates. |
| `npm run test:security` | Pass: 656 reachable Git blobs, current nonignored files, 16 client JS chunks and 34 public Data Cache entries (821 text checks); no known secret signatures/private markers. Full local history, shallow=false. Ignored env files not read. |
| `npm audit --audit-level=moderate` | Zero reported vulnerabilities. No dependency added in Phase 7. |
| `git diff --check` | Pass. |
| `git diff --quiet 6d774c7050fda2ab386fa4dfe297d4a4f4776715 -- index.html assets projects` | Exit0: legacy source/content/assets unchanged. |

Cache browser workflow proves the group is cached with a direct DB-only test probe, then preserves that unrelated cached label through project mutations. Actual CMS writes immediately update title/new slug, remove old slug/public draft/sitemap and finally reveal the label only when its own CMS action expires it. A private saved preview never makes the draft publicly readable. Existing settings/media/section/group visibility tests continue to verify their write→read behavior. Parser-inserted untrusted script is blocked by actual browser CSP; checking DevTools-evaluated dynamic scripts would not be equivalent and is not used as evidence.

The first read-only Git batch scan stalled inside the restricted sandbox. Its owned process was stopped, a 15-second subprocess timeout added, and the identical scan passed outside the sandbox with host permission; no credentials printed. Initial test-only expectation errors were corrected against actual stored name and real parser security semantics; application safeguards were not weakened.

## Limits and next gate

Signature scans are bounded detection, not proof of absence; legacy public history may already contain personal facts intentionally preserved by this migration. No private fixture/operator credentials are part of app imports. CI now fetches full history and runs the scan, but GitHub Actions itself was not executed from this environment. Browser traces remain ignored because they contain session/action material.

Scheduled/direct-SQL edits use eventual stale-while-revalidate, not immediate CMS expiry. Multi-replica hosting requires shared cache/tag propagation. Hosted TLS/forwarded headers, CDN, real owner bootstrap/recovery, Auth abuse settings, Storage, backup/restore and physical phone performance remain explicit deployment checks. No live SMTP/contact form exists. PDF checks are not sanitization; rare metadata-registration orphan failure remains documented but not fault-injected. Browser SPA Back/Forward unsaved prompting remains limited. Final accessible/performance audit and README/handoff are Phase 8.
