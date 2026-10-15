import Link from "next/link";
import { notFound } from "next/navigation";
import {
  saveGalleryAction,
  deleteProjectAction,
  removeGalleryAction,
} from "@/app/admin/actions";
import { ProjectForm, mediaOptions } from "@/components/admin/content-forms";
import { EditorForm } from "@/components/admin/editor-form";
import {
  getAdminProject,
  getAdminMedia,
  getAdminGallery,
} from "@/lib/dal/admin";
export default async function EditProject({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string }>;
}) {
  const { id } = await params;
  const project = await getAdminProject(id);
  if (!project) notFound();
  const [media, gallery, query] = await Promise.all([
    getAdminMedia(),
    getAdminGallery(id),
    searchParams,
  ]);
  const options = mediaOptions(media, project.status === "published").filter(
    (option) => !!option.value,
  );
  return (
    <>
      <h1>Edit project</h1>
      <p>
        <Link href={`/admin/projects/${id}/preview`}>Preview saved draft</Link>
      </p>
      {query.created === "1" && (
        <p role="status">Project created. Review it before publishing.</p>
      )}
      {project.status === "published" &&
        project.published_at &&
        Date.parse(project.published_at) <= Date.now() && (
          <p>
            <Link href={`/projects/${project.slug}`}>
              View published project
            </Link>
          </p>
        )}
      <ProjectForm key={project.id} project={project} media={media} />
      <section className="admin-panel" aria-labelledby="gallery-heading">
        <h2 id="gallery-heading">Gallery</h2>
        <p>
          Use existing images. Gallery changes save separately. Select an
          existing gallery image again to update its caption or order. Removing
          a gallery entry retains its media asset.
        </p>
        <ul className="admin-list">
          {gallery.map((item) => (
            <li key={item.id}>
              <div>
                <strong>
                  {media.find((asset) => asset.id === item.media_id)?.label ||
                    "Image"}
                </strong>
                <p>{item.caption}</p>
                <small>Order {item.sort_order}</small>
              </div>
              <EditorForm
                action={removeGalleryAction}
                hidden={{ id: item.id, project_id: id }}
                fields={[
                  {
                    name: "confirmation",
                    label: "Confirm removal",
                    type: "checkbox",
                    required: true,
                  },
                ]}
                submitLabel="Remove gallery image"
                protectChanges={false}
              />
            </li>
          ))}
        </ul>
        {!gallery.length && <p>No gallery images.</p>}
        {options.length > 0 && (
          <EditorForm
            action={saveGalleryAction}
            hidden={{ project_id: id }}
            fields={[
              {
                name: "media_id",
                label: "Gallery image",
                type: "select",
                required: true,
                options: [{ value: "", label: "Choose an image" }, ...options],
              },
              { name: "caption", label: "Caption", maxLength: 500 },
              {
                name: "sort_order",
                label: "Gallery order",
                type: "number",
                required: true,
              },
            ]}
            initial={{ sort_order: "0" }}
            submitLabel="Save gallery image"
          />
        )}
      </section>
      <section className="admin-panel" aria-labelledby="delete-heading">
        <h2 id="delete-heading">Delete project</h2>
        <p>
          Deletion permanently removes this project and its gallery entries.
          Media assets are retained. Archive it above to keep a recoverable
          record.
        </p>
        <EditorForm
          key={project.updated_at}
          action={deleteProjectAction}
          hidden={{ id, revision: project.updated_at }}
          fields={[
            {
              name: "confirmation",
              label: "Type the current slug to confirm deletion",
              required: true,
              maxLength: 100,
              hint: project.slug,
            },
          ]}
          submitLabel="Delete project permanently"
        />
      </section>
    </>
  );
}
