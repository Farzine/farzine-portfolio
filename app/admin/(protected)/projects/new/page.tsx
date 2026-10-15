import { requireAdminPage } from "@/lib/auth/require-admin-page";
import { getAdminImageChoices } from "@/lib/dal/admin-media";
import { projectFields } from "@/lib/admin/fields";
import { ContentEditor } from "@/components/admin/editor";
import { saveProjectAction } from "@/app/admin/actions";
export default async function NewProject() {
  await requireAdminPage();
  return (
    <>
      <p className="eyebrow">Projects / Create</p>
      <h1>New project</h1>
      <p className="muted">
        Keep new work as a draft until its text and links are reviewed.
      </p>
      <ContentEditor
        action={saveProjectAction}
        fields={projectFields}
        images={await getAdminImageChoices()}
        values={{ status: "draft", sort_order: 0 }}
      />
    </>
  );
}
