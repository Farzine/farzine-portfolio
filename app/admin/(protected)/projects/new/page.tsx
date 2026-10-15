import { ProjectForm } from "@/components/admin/content-forms";
import { getAdminMedia } from "@/lib/dal/admin";
export default async function NewProject() {
  return (
    <>
      <h1>Create project</h1>
      <p>
        New projects start as drafts. Choose an existing cover now; add gallery
        images after saving.
      </p>
      <ProjectForm media={await getAdminMedia()} />
    </>
  );
}
