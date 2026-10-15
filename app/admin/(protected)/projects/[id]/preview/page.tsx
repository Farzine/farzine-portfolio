import { notFound } from "next/navigation";
import { getAdminProject, getAdminProjectGallery } from "@/lib/dal/admin";
import { publicProjectSchema } from "@/lib/validations/public-content";
import { recordId } from "@/lib/validations/admin-content";
import { ProjectDetail } from "@/components/projects/project-detail";
export default async function PreviewProject({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!recordId.safeParse(id).success) notFound();
  const record = await getAdminProject(id);
  if (!record) notFound();
  return (
    <>
      <p className="admin-preview">
        Protected preview · Saved {record.status} content. Unsaved edits are not
        included.
      </p>
      <ProjectDetail
        gallery={await getAdminProjectGallery(id)}
        project={publicProjectSchema.parse({ ...record, status: "published" })}
        backHref={`/admin/projects/${id}`}
        backLabel="Project editor"
      />
    </>
  );
}
