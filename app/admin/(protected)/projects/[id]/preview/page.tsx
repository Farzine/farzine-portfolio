import Link from "next/link";
import { notFound } from "next/navigation";
import { ProjectDetails } from "@/components/projects/project-details";
import { getAdminProjectPreview } from "@/lib/dal/admin";
export default async function DraftPreview({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await getAdminProjectPreview(id);
  if (!project) notFound();
  return (
    <>
      <p>
        <Link href={`/admin/projects/${id}`}>← Return to editor</Link>
      </p>
      <p role="status">
        Private preview of saved content. Unsaved edits and private files are
        omitted.
      </p>
      <ProjectDetails project={project} />
    </>
  );
}
