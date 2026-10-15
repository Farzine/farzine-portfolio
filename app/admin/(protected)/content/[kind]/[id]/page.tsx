import { getAdminProjects } from "@/lib/dal/admin";
import { getAdminMedia } from "@/lib/dal/admin-media";
import { notFound } from "next/navigation";
import Link from "next/link";
import { collections } from "@/lib/admin/collections";
import { collectionKind } from "@/lib/validations/admin-collections";
import { recordId } from "@/lib/validations/admin-content";
import { getAdminCollection } from "@/lib/dal/admin-collections";
import { getAdminImageChoices } from "@/lib/dal/admin-media";
import { ContentEditor } from "@/components/admin/editor";
import { DeleteContent } from "@/components/admin/delete-project";
import {
  saveCollectionAction,
  deleteCollectionAction,
} from "@/app/admin/collection-actions";
export default async function ItemPage({
  params,
}: {
  params: Promise<{ kind: string; id: string }>;
}) {
  const { kind: input, id } = await params;
  const parsed = collectionKind.safeParse(input);
  if (!parsed.success || (id !== "new" && !recordId.safeParse(id).success))
    notFound();
  const kind = parsed.data;
  const definition = collections[kind];
  const rows = await getAdminCollection(kind);
  const record = rows.find((row) => row.id === id);
  if (id !== "new" && !record) notFound();
  const groups =
    kind === "skills" ? await getAdminCollection("skill_groups") : [];
  const projects = kind === "project_media" ? await getAdminProjects() : [];
  const media = kind === "project_media" ? await getAdminMedia() : [];
  const fields = definition.fields.map((field) => {
    if (field.name === "group_id")
      return {
        ...field,
        options: [
          { value: "", label: "Choose a group" },
          ...groups.map((group) => ({ value: group.id, label: group.label })),
        ],
      };
    if (field.name === "project_id")
      return {
        ...field,
        options: [
          { value: "", label: "Choose a project" },
          ...projects.map((project) => ({
            value: project.id,
            label: project.title,
          })),
        ],
      };
    if (field.name === "media_id")
      return {
        ...field,
        options: [
          { value: "", label: "Choose a public image" },
          ...media
            .filter(
              (asset) =>
                asset.is_public && asset.mime_type.startsWith("image/"),
            )
            .map((asset) => ({ value: asset.id, label: asset.alt_text })),
        ],
      };
    return field;
  });
  return (
    <>
      <p className="eyebrow">
        {definition.label} / {record ? "Edit" : "Create"}
      </p>
      <h1>{record?.label ?? "New item"}</h1>
      <Link className="text-link" href={`/admin/content/${kind}`}>
        Back to {definition.label.toLowerCase()}
      </Link>
      {kind === "profile_facts" ? (
        <p className="muted">
          Private facts are visible only in this workspace. Publishing exposes a
          value publicly; avoid sensitive information.
        </p>
      ) : null}
      <ContentEditor
        key={`${kind}:${id}`}
        action={saveCollectionAction.bind(null, kind)}
        fields={fields}
        values={record?.values ?? definition.defaults}
        images={await getAdminImageChoices()}
        id={record?.id}
        version={record?.version}
        savedPath={`/admin/content/${kind}`}
        preview={false}
      />
      {record ? (
        <DeleteContent
          id={record.id}
          title={record.label}
          version={record.version}
          action={deleteCollectionAction.bind(null, kind)}
        />
      ) : null}
    </>
  );
}
