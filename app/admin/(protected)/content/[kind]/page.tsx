import Link from "next/link";
import { notFound } from "next/navigation";
import { collections } from "@/lib/admin/collections";
import { collectionKind } from "@/lib/validations/admin-collections";
import { getAdminCollection } from "@/lib/dal/admin-collections";
export default async function CollectionPage({
  params,
  searchParams,
}: {
  params: Promise<{ kind: string }>;
  searchParams: Promise<{ q?: string | string[] }>;
}) {
  const parsed = collectionKind.safeParse((await params).kind);
  if (!parsed.success) notFound();
  const kind = parsed.data;
  const definition = collections[kind];
  const rows = await getAdminCollection(kind);
  const query = (await searchParams).q;
  const q = typeof query === "string" ? query : "";
  const filtered = rows.filter((row) =>
    row.label.toLowerCase().includes(q.toLowerCase()),
  );
  return (
    <>
      <p className="eyebrow">Content / {definition.label}</p>
      <h1>{definition.label}</h1>
      <div className="link-row">
        <Link className="button" href={`/admin/content/${kind}/new`}>
          Create item
        </Link>
        <Link className="text-link" href="/admin/content">
          All collections
        </Link>
      </div>
      <form className="admin-filter">
        <label htmlFor="q">Search titles</label>
        <input id="q" name="q" defaultValue={q} />
        <button type="submit" className="button secondary">
          Search
        </button>
      </form>
      <p className="muted small">
        {filtered.length} of {rows.length} items
      </p>
      <div className="admin-list">
        {filtered.map((row) => (
          <div className="admin-row" key={row.id}>
            <div>
              <Link
                className="text-link"
                href={`/admin/content/${kind}/${row.id}`}
              >
                {row.label}
              </Link>
              <p className="muted small">
                {row.values.status ??
                  (row.values.is_public ? "Public" : "Private")}{" "}
                / Order {row.values.sort_order}
              </p>
            </div>
            <Link
              className="text-link"
              href={`/admin/content/${kind}/${row.id}`}
            >
              Edit
            </Link>
          </div>
        ))}
      </div>
      {!filtered.length ? (
        <p>No matching items. Create an item or change your search.</p>
      ) : null}
    </>
  );
}
