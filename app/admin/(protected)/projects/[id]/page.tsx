import { notFound } from "next/navigation";
import { getAdminProject } from "@/lib/dal/admin";
import { recordId } from "@/lib/validations/admin-content";
import { getAdminImageChoices } from "@/lib/dal/admin-media";
import { projectFields } from "@/lib/admin/fields";
import { ContentEditor } from "@/components/admin/editor";
import { DeleteProject } from "@/components/admin/delete-project";
import { saveProjectAction } from "@/app/admin/actions";
export default async function EditProject({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!recordId.safeParse(id).success) notFound();
  const project = await getAdminProject(id);
  if (!project) notFound();
  const values = {
    title: project.title,
    slug: project.slug,
    summary: project.summary,
    details: project.details,
    category: project.category,
    technologies: project.technologies.join(", "),
    cover_image: project.cover_image,
    cover_alt: project.cover_alt,
    repository_url: project.repository_url,
    demo_url: project.demo_url,
    download_url: project.download_url,
    featured: project.featured,
    sort_order: project.sort_order,
    status: project.status,
    seo_title: project.seo_title,
    seo_description: project.seo_description,
  };
  return (
    <>
      <p className="eyebrow">Projects / Edit</p>
      <h1>{project.title}</h1>
      <ContentEditor
        key={project.id}
        action={saveProjectAction}
        fields={projectFields}
        images={await getAdminImageChoices()}
        values={values}
        id={project.id}
        version={project.updated_at}
      />
      <div className="danger-zone">
        <h2>Remove project</h2>
        <p>
          Archive the project with its publication status to keep a private
          copy, or permanently delete it.
        </p>
        <DeleteProject
          id={project.id}
          title={project.title}
          version={project.updated_at}
        />
      </div>
    </>
  );
}
