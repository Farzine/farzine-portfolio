import Link from "next/link";
import { getAdminProjects } from "@/lib/dal/admin";
export default async function AdminProjects({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[]; status?: string | string[] }>;
}) {
  const [projects, query] = await Promise.all([
    getAdminProjects(),
    searchParams,
  ]);
  const q = typeof query.q === "string" ? query.q.slice(0, 180) : "";
  const status =
    typeof query.status === "string" &&
    ["draft", "published", "archived"].includes(query.status ?? "")
      ? query.status
      : "";
  const shown = projects.filter(
    (project) =>
      (!status || project.status === status) &&
      project.title.toLowerCase().includes(q.toLowerCase()),
  );
  return (
    <>
      <p className="eyebrow">Content / Projects</p>
      <div className="admin-title">
        <h1>Projects</h1>
        <Link className="button" href="/admin/projects/new">
          Create project
        </Link>
      </div>
      <form className="admin-filter" action="/admin/projects">
        <label htmlFor="q">Search title</label>
        <input id="q" name="q" defaultValue={q} maxLength={180} />
        <label htmlFor="filter-status">Status</label>
        <select id="filter-status" name="status" defaultValue={status}>
          <option value="">All statuses</option>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="archived">Archived</option>
        </select>
        <button type="submit" className="button secondary">
          Filter
        </button>
      </form>
      {shown.length ? (
        <ul className="admin-list">
          {shown.map((project) => (
            <li key={project.id}>
              <div>
                <Link href={`/admin/projects/${project.id}`}>
                  {project.title}
                </Link>
                <p className="small muted">
                  /{project.slug} · {project.status}
                  {project.featured ? " · Featured" : ""} · Order{" "}
                  {project.sort_order}
                </p>
              </div>
              <Link
                className="text-link"
                href={`/admin/projects/${project.id}`}
              >
                Edit
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p>No projects match this filter.</p>
      )}
    </>
  );
}
