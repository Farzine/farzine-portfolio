import Image from "next/image";
import {
  updateMediaAction,
  promoteMediaAction,
  deleteMediaAction,
} from "@/app/admin/media-actions";
import { MediaUpload } from "@/components/admin/media-upload";
import { EditorForm } from "@/components/admin/editor-form";
import { getMediaLibrary } from "@/lib/dal/media";
import { readSupabaseConfig } from "@/lib/security/runtime-config";
export default async function MediaPage() {
  const media = await getMediaLibrary();
  const origin = readSupabaseConfig().url;
  return (
    <>
      <h1>Media library</h1>
      <p>
        Upload a replacement as a new asset, then select it in the relevant
        content forms. Existing assets stay intact. Deletion is blocked until
        all content references are removed; original source files are always
        retained.
      </p>
      <MediaUpload />
      <h2>Assets ({media.length})</h2>
      {media.map((asset) => (
        <details
          className="admin-panel"
          key={asset.id}
          data-asset-id={asset.id}
        >
          <summary>
            {asset.label} ·{" "}
            {asset.pending_delete
              ? "cleanup pending"
              : asset.is_public
                ? "public"
                : "private"}
          </summary>
          {!asset.pending_delete && asset.kind === "image" && (
            <Image
              src={asset.legacy_path || `/admin/media/${asset.id}/file`}
              unoptimized={!asset.legacy_path}
              width={asset.width || 200}
              height={asset.height || 200}
              alt={asset.alt_text || asset.label}
              style={{ width: 200, maxWidth: "100%", height: "auto" }}
            />
          )}
          {!asset.pending_delete && asset.bucket && (
            <p>
              <a href={`/admin/media/${asset.id}/file`}>
                {asset.kind === "document" ? "Download document" : "Open image"}
              </a>
            </p>
          )}
          {!asset.pending_delete && asset.is_public && (
            <p>
              Public URL:{" "}
              <a
                href={
                  asset.legacy_path ||
                  `${origin}/storage/v1/object/public/${asset.bucket}/${asset.object_path}`
                }
              >
                {asset.legacy_path ||
                  `${origin}/storage/v1/object/public/${asset.bucket}/${asset.object_path}`}
              </a>
            </p>
          )}
          {!asset.pending_delete && (
            <EditorForm
              action={updateMediaAction}
              fields={[
                {
                  name: "label",
                  label: "Label",
                  required: true,
                  maxLength: 200,
                },
                { name: "alt_text", label: "Alternative text", maxLength: 500 },
              ]}
              initial={{ label: asset.label, alt_text: asset.alt_text }}
              hidden={{ id: asset.id, revision: asset.updated_at }}
              submitLabel="Save media description"
            />
          )}
          {!asset.pending_delete && !asset.is_public && (
            <EditorForm
              action={promoteMediaAction}
              hidden={{ id: asset.id }}
              fields={[
                {
                  name: "confirmation",
                  label: "Make a publicly accessible copy",
                  type: "checkbox",
                  required: true,
                },
              ]}
              submitLabel="Create public copy"
              protectChanges={false}
            />
          )}
          <EditorForm
            key={asset.updated_at}
            action={deleteMediaAction}
            hidden={{ id: asset.id, revision: asset.updated_at }}
            fields={[
              {
                name: "confirmation",
                label: "Confirm permanent media removal",
                type: "checkbox",
                required: true,
                hint: asset.legacy_path
                  ? "Remove this library entry only; the original source file is retained. Referenced entries cannot be removed."
                  : "All content references must be removed first. If cleanup fails, this entry remains available for retry.",
              },
            ]}
            submitLabel={
              asset.pending_delete ? "Retry media cleanup" : "Delete media"
            }
            protectChanges={false}
          />
        </details>
      ))}
    </>
  );
}
