# Owner editing workflow

Admin routes use the existing palette/fonts with compact forms. Create the first owner account and allowlist its verified UUID as described in [Supabase setup](supabase.md). Open `/admin/login`. There is no registration route. Initial password setup and recovery are operator tasks through the provider Dashboard. This app has no invitation-token/password-reset callback UI; verify an operator recovery procedure before deployment rather than sending a reset link to an unsupported page.

## Available workflows

- Overview: actual draft/published/archived project counts and recently updated records, without visitor analytics.
- Site settings: identity, role introduction/list, biography, public profile/icon/social-preview image selection, CTA labels/URLs, displayed update label/date, footer and SEO defaults. These fields are public. Private contact facts are separate under Content → Personal facts and contact.
- Projects: search title/slug, status filter, display-order/title sort; create, edit, publish, schedule, unpublish, archive and permanently delete. Edit stable slug, category, plain-text paragraphs, one-per-line technologies, cover, links, feature flag, display order and metadata. Published content requires a publication timestamp and public images. UTC times use ISO format; saving a record does not invent claim dates.
- Saved draft preview: a private authenticated route reuses the public detail renderer. Unsaved changes are omitted; authorized private image covers/gallery use the no-store admin proxy. Public routes always use an anonymous client, even for logged-in owners.
- Gallery: select existing images, set caption/order and save. Selecting the same image updates that gallery entry. Explicit confirmation removes an entry while preserving the asset. Uploads, image descriptions, public copies and reference-safe deletion are in Media.

Save buttons disable while pending. Field errors appear below associated inputs; status receives focus and is announced. Entered values survive validation failures. Settings/project revisions are checked atomically against `updated_at`; a concurrent change requires reloading, rather than overwriting another editor. Unsaved forms prompt on link navigation and page unload. Browsers control unload prompts; history navigation within the client router is a remaining limitation. Save before using browser Back/Forward. Slug changes make the previous public URL return 404; update external references deliberately.

Deletion requires typing the current slug; it removes the project/gallery and retains media. Archive instead if recovery is needed. Sign out revokes this browser session through the provider and clears its cookies; it does not log out other devices. Remove a UUID from the private allowlist to withdraw CMS authority immediately, independently of access-token expiry.

## Local verification and credentials

`npm run test:fixtures:local` now prepares two dedicated `.invalid` Auth users, with the public **test-only** passwords in `tests/fixtures/admin-accounts.json`. Only the admin UUID is allowlisted. Both users deliberately carry forged admin metadata to verify it grants no authority. Never provision these fixtures in a hosted/valued project. The script accepts only this repository’s fixed loopback API and local Docker container, reads a local provider operator key in memory, and never prints it or writes it into application env/source. No emails are sent. The application itself uses no operator/service key.

Build with `npm run build:local`, then `npm run test:e2e:local`. Playwright owns reserved test port 3102 and refuses existing-server reuse; development on 3000 can remain running. Admin tests additionally reject any Supabase API other than the fixed local fixture URL. Public tests run before mutating admin tests so project-count assertions cannot race temporary publication fixtures. To isolate admin checks: `npm run test:e2e:admin:local`. Set `CHROME_PATH=/usr/bin/google-chrome` if using installed Chrome. Browser traces are ignored because session cookies/action payloads are sensitive; never publish them without review.

Real Auth, private headers, action replay denials, stale writes, publication and direct Data API behavior are tested locally; hosted provisioning, rate-limit/recovery settings and operational backup checks remain explicit deployment gates. See [security](security.md) and [phase checklist](implementation-plan.md).

## Remaining content and display settings

Content provides structured editors for personal/contact facts, experience, education, certifications, achievements, skill groups/skills, interests, social links, resume/document links, navigation and section titles/order/visibility. Search uses titles/labels; small collections use expandable forms. All imported fields retain source wording until reviewed. New entries start hidden; visibility must be explicit. Skill groups must be empty before deletion. Contact remains editable real contact information/social/email links; there is no message-delivery form or fake success state.

Section keys/hierarchy are fixed to preserve the original composition. Edit existing section rows or hide them; they are not page-builder blocks. The All-filter label is used by the portfolio category filter. Home identity remains the site shell; its section visibility controls navigation. Each item’s own visibility controls public API access; hiding a section alone does not make visible items private. Navigation can be created/edited/deleted for the original root section keys, one item per section.

Public interface labels exposes the 20 fixed navigation/project/filter/empty-state strings, including accessible names and theme labels. Their keys are fixed; values are editable and escaped plain text. Framework error/recovery messages, admin instructions and the development-only preview notice are operational UI rather than owner portfolio content. Fonts/component geometry/code are not CMS content. [Media workflow](media.md) explains private/public files, safe replacement, downloads and recovery.
