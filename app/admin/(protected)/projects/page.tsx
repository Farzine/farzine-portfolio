import Link from "next/link";
import { getAdminProjects } from "@/lib/dal/admin";
export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    status?: string;
    sort?: string;
    deleted?: string;
  }>;
}) {
  const [projects, query] = await Promise.all([
    getAdminProjects(),
    searchParams,
  ]);
  const text =
    typeof query.q === "string" ? query.q.slice(0, 200).toLowerCase() : "";
  const status = ["draft", "published", "archived"].includes(query.status || "")
    ? query.status
    : "";
  const results = projects.filter(
    (project) =>
      (!status || project.status === status) &&
      `${project.title} ${project.slug}`.toLowerCase().includes(text),
  );
  if (query.sort === "title")
    results.sort((a, b) => a.title.localeCompare(b.title));
  return (
    <>
      <h1>Projects</h1>
      <p>
        <Link href="/admin/projects/new">Create project</Link>
      </p>
      {query.deleted === "1" && (
        <p role="status">Project deleted. Media assets were retained.</p>
      )}
      <form className="admin-search" method="get">
        <label>
          Search
          <input name="q" defaultValue={text} maxLength={200} />
        </label>
        <label>
          Status
          <select name="status" defaultValue={status}>
            <option value="">All</option>
            {["draft", "published", "archived"].map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </label>
        <label>
          Sort
          <select
            name="sort"
            defaultValue={query.sort === "title" ? "title" : "order"}
          >
            <option value="order">Display order</option>
            <option value="title">Title</option>
          </select>
        </label>
        <button type="submit">Apply filters</button>
      </form>
      <p>
        {results.length} of {projects.length} projects
      </p>
      <ul className="admin-list">
        {results.map((project) => (
          <li key={project.id}>
            <div>
              <Link href={`/admin/projects/${project.id}`}>
                {project.title}
              </Link>
              <small>
                /{project.slug} · order {project.sort_order}
                {project.featured ? " · featured" : ""}
              </small>
            </div>
            <span>{project.status}</span>
          </li>
        ))}
      </ul>
      {!results.length && (
        <p>No projects match. Clear the filters or create a draft.</p>
      )}
    </>
  );
}
