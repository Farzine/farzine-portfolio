import Link from "next/link";
import { notFound } from "next/navigation";
import { Media } from "@/components/site/media";
import { ProjectDetails } from "@/components/projects/project-details";
import { getAdminProjectPreview } from "@/lib/dal/admin";
export default async function DraftPreview({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const preview = await getAdminProjectPreview(id);
  if (!preview) notFound();
  const { project, copy } = preview;
  return (
    <>
      <p>
        <Link href={`/admin/projects/${id}`}>← Return to editor</Link>
      </p>
      <p role="status">
        Private preview of saved content. Unsaved edits are omitted. Private
        images are available only to authorized admins.
      </p>
      {project.cover && (
        <figure>
          <figcaption>Cover image</figcaption>
          <Media media={project.cover} />
        </figure>
      )}
      <ProjectDetails project={project} copy={copy} />
    </>
  );
}
