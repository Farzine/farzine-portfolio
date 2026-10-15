import { ContentEditor } from "@/components/admin/editor";
import { getAdminMedia } from "@/lib/dal/admin-media";
import { MediaUpload } from "@/components/admin/media-upload";
import { DeleteContent } from "@/components/admin/delete-project";
import {
  deleteMediaAction,
  saveAssetDescriptionAction,
} from "@/app/admin/media-actions";
export default async function MediaPage() {
  const media = await getAdminMedia();
  return (
    <>
      <p className="eyebrow">Content / Assets</p>
      <h1>Media library</h1>
      <MediaUpload />
      <h2>Uploaded assets</h2>
      {!media.length ? (
        <p>
          No uploaded assets. Original portfolio images remain available in
          image selectors.
        </p>
      ) : null}
      <div className="admin-list">
        {media.map((item) => (
          <article className="admin-row" key={item.id}>
            <div>
              <h3>{item.alt_text}</h3>
              <p className="muted small">
                {item.is_public ? "Public" : "Private"} / {item.mime_type} /{" "}
                {Math.round(item.byte_size / 1024)} KiB
              </p>
              {item.url ? (
                <>
                  <a
                    href={item.url}
                    className="text-link"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Open asset ↗
                  </a>
                  <p className="small asset-url">{item.url}</p>
                </>
              ) : (
                <a
                  href={`/admin/media/${item.id}/download`}
                  className="text-link"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Download private asset ↗
                </a>
              )}
            </div>
            <div>
              <ContentEditor
                action={saveAssetDescriptionAction}
                fields={[
                  {
                    name: "alt_text",
                    label: "Asset description",
                    required: true,
                    maxLength: 400,
                  },
                ]}
                values={{ alt_text: item.alt_text }}
                images={[]}
                id={item.id}
                version={item.updated_at}
                idPrefix={`${item.id}-`}
                savedPath={null}
                preview={false}
              />
              <DeleteContent
                id={item.id}
                title={item.alt_text}
                version={item.updated_at}
                action={deleteMediaAction}
              />
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
