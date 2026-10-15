# Media workflow and failure recovery

The protected `/admin/media` library includes the 28 original used raster assets and new uploads. Original repository files are preserved. The library edits labels/alt text, uploads, makes public copies, and removes unreferenced entries/files. Content forms select assets by ID; skills also support the original external logo URLs or a public library URL. Account setup is in [Supabase setup](supabase.md).

## Upload and visibility

Start private. Upload PNG/JPEG/WebP/AVIF up to 10 MiB and 24 megapixels, or PDF up to 10 MiB. The authenticated route checks origin and bounds the multipart stream (10 MiB plus 64 KiB of form overhead), then the authorized DAL validates metadata, extension, MIME and bytes. Raster input is decoded with sharp 0.35.5, single-frame only, rotated, resized inside 2400×2400 without enlargement, and re-encoded as WebP with metadata stripped. SVG/HTML/GIF and spoofed/undecodable files are rejected. PDF gets header/end-marker/type/size checks; this is **not PDF sanitization or full semantic document verification**. The private download route sends PDF as an attachment with nosniff/sandbox/no-store headers. [sharp constructor](https://sharp.pixelplumbing.com/api-constructor/) and [resize documentation](https://sharp.pixelplumbing.com/api-resize/) describe the supported decoder/limit APIs.

Generated object keys use verified-admin UUID / random asset UUID.extension; filenames never become paths. Storage limits/types/policies are an additional boundary. Application code uses the session client and RLS, never an operator/service key. Uploads also work as native multipart submissions without JavaScript, reporting an honest status on the result page.

Private images/files are served through an independently authorized, no-store admin proxy, not browser-readable tokens or shared signed URLs. Saved project previews include private covers/gallery through that same route. Anonymous/non-admin reads return 401/403. Public portfolio DTOs never include these proxy URLs/private objects.

“Create public copy” revalidates the stored bytes and creates a separate public object/record. Save description changes first; the copy uses saved metadata. It does not rewrite existing references or make the original private file public. Choose the copy in content and explicitly publish/enable visibility. Public bytes are reachable even when a project is a draft. Public URLs/cached copies cannot be made confidential by hiding a DB row.

## Replacement and deletion

1. Upload a replacement and review it. Existing files remain immutable; overwriting an existing object is denied by Storage RLS.
2. Select the new asset in the affected settings/projects/gallery/collection/document forms. A visible/published item requires public images/assets. Documents require either an external URL or a media asset, with the other field empty.
3. Remove every reference to the old asset, including hidden/draft content. Deletion checks global image fields, project covers/gallery, education, certificates and documents. Original legacy files stay on disk when an unused library entry is removed.
4. Confirm deletion. A DB trigger locks the media row and rejects any remaining reference before marking `pending_delete`. Reference triggers reject selecting a pending asset. Storage deletion requires that tombstone and no references. The app verifies the object is absent before deleting its metadata.

If Storage/network removal fails, the tombstone remains visible to admins with “Retry media cleanup”; it is unavailable to selectors/public DTOs. Retry is idempotent when bytes are already gone. A volatile reference predicate sees commits after lock waits; executable two-session tests prove a new reference and a deletion tombstone cannot both commit, in either order.

Storage and Postgres are separate systems: if bytes upload successfully but metadata registration fails, the app returns failure, changes no content references and logs bucket/object UUID only for operator cleanup. This rare outage path is handled/documented but has not been fault-injected. An operator must inspect that exact unregistered object in the provider console, verify there is no matching media record/reference and remove only that orphan. The app deliberately does not bypass reference policies to delete untracked files. No automatic bulk cleanup or irreversible external deletion is authorized by these docs.

## Verification

`npm run test:db` runs grants/RLS/constraints plus both lock-order races in the reserved disposable PostgreSQL harness. `npm run test:e2e:local` uses the full local provider and owned app port 3102: spoofed-upload failure, actual raster upload/metadata, private image access/preview, non-admin/anonymous denials, public promotion/download, description edits, referenced deletion failure, actual unreferenced object removal, private PDF attachment and resumed cleanup. Exact coverage/results are in [Phase 5 evidence](qa/phase-5.md). Hosted Storage/CDN behavior, outage fault injection and exhaustive deployment/secret/CSP audits remain later gates.
