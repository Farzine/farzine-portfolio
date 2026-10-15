import Link from "next/link";
import { notFound } from "next/navigation";
import {
  saveCollectionAction,
  deleteCollectionAction,
} from "@/app/admin/collection-actions";
import {
  collectionFields,
  collectionLabels,
  formValues,
} from "@/components/admin/collection-fields";
import { EditorForm } from "@/components/admin/editor-form";
import { getAdminCollection } from "@/lib/dal/collections";
import { getAdminMedia } from "@/lib/dal/admin";
import { collectionNameSchema } from "@/lib/validations/collections";
export default async function CollectionPage({
  params,
  searchParams,
}: {
  params: Promise<{ collection: string }>;
  searchParams: Promise<{ q?: string }>;
}) {
  const parsed = collectionNameSchema.safeParse((await params).collection);
  if (!parsed.success) notFound();
  const name = parsed.data;
  const [rows, media, groups, query] = await Promise.all([
    getAdminCollection(name),
    getAdminMedia(),
    getAdminCollection("skill_groups"),
    searchParams,
  ]);
  const fields = collectionFields(
    name,
    media,
    groups.filter(
      (row): row is typeof row & { id: string; name: string } =>
        "name" in row && "id" in row,
    ),
  );
  const initial = Object.fromEntries(
    fields.map((field) => [
      field.name,
      field.type === "checkbox"
        ? false
        : field.type === "select"
          ? field.options?.[0]?.value || ""
          : field.name === "sort_order"
            ? "0"
            : field.name === "color"
              ? "#21e5f3"
              : "",
    ]),
  );
  const text =
    typeof query.q === "string" ? query.q.slice(0, 200).toLowerCase() : "";
  const title = (row: Record<string, unknown>) =>
    String(
      row.label ||
        row.title ||
        row.name ||
        row.organization ||
        row.qualification ||
        row.key ||
        "Item",
    );
  const filtered = rows.filter((row) =>
    title(row).toLowerCase().includes(text),
  );
  return (
    <>
      <p>
        <Link href="/admin/content">← All content</Link>
      </p>
      <h1>{collectionLabels[name]}</h1>
      {name === "profile_facts" && (
        <p>
          Birthday, address, phone and other personal facts are private until
          you explicitly enable public visibility. Hiding a section alone does
          not make its items private.
        </p>
      )}
      <form method="get" className="admin-search">
        <label>
          Search titles
          <input name="q" defaultValue={text} maxLength={200} />
        </label>
        <button type="submit">Search</button>
      </form>
      <p>
        {filtered.length} of {rows.length} items
      </p>
      {filtered.map((row) => {
        const id = "id" in row ? row.id : row.key;
        return (
          <details className="admin-panel" key={id}>
            <summary>
              {title(row)} ·{" "}
              {!("is_visible" in row) || row.is_visible ? "public" : "hidden"} ·
              order {"sort_order" in row ? row.sort_order : 0}
            </summary>
            <EditorForm
              action={saveCollectionAction}
              fields={fields}
              initial={formValues(row)}
              hidden={{ collection: name, id, revision: row.updated_at }}
              submitLabel="Save content"
            />
            {name !== "section_settings" && name !== "public_labels" && (
              <EditorForm
                key={row.updated_at}
                action={deleteCollectionAction}
                hidden={{ collection: name, id, revision: row.updated_at }}
                fields={[
                  {
                    name: "confirmation",
                    label: "Confirm permanent deletion",
                    type: "checkbox",
                    required: true,
                    hint:
                      name === "skill_groups"
                        ? "Move or delete the group's skills first. This action cannot be undone."
                        : "This action cannot be undone. Media assets are retained.",
                  },
                ]}
                submitLabel="Delete item permanently"
                protectChanges={false}
              />
            )}
          </details>
        );
      })}
      {!filtered.length && <p>No matching items.</p>}
      {name !== "section_settings" && name !== "public_labels" && (
        <section className="admin-panel">
          <h2>Create item</h2>
          <EditorForm
            action={saveCollectionAction}
            resetOnSuccess
            fields={fields}
            initial={initial}
            hidden={{ collection: name, id: "", revision: "" }}
            submitLabel="Create content"
          />
        </section>
      )}
    </>
  );
}
