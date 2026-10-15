import Link from "next/link";
import { getAdminProjects } from "@/lib/dal/admin";
export default async function Dashboard() {
  const projects = await getAdminProjects();
  return (
    <>
      <h1>Overview</h1>
      <p>
        Manage the portfolio’s content. Historical imports remain drafts until
        reviewed.
      </p>
      <dl className="admin-counts">
        {["draft", "published", "archived"].map((status) => (
          <div key={status}>
            <dt>{status} projects</dt>
            <dd>
              {projects.filter((project) => project.status === status).length}
            </dd>
          </div>
        ))}
      </dl>
      <p>
        <Link href="/admin/projects/new">Create a project</Link> ·{" "}
        <Link href="/admin/settings">Edit site identity and SEO</Link>
      </p>
      <h2>Recently changed projects</h2>
      <ul className="admin-list">
        {[...projects]
          .sort((a, b) => b.updated_at.localeCompare(a.updated_at))
          .slice(0, 5)
          .map((project) => (
            <li key={project.id}>
              <Link href={`/admin/projects/${project.id}`}>
                {project.title}
              </Link>
              <span>{project.status}</span>
            </li>
          ))}
      </ul>
      {!projects.length && <p>No projects yet. Create your first draft.</p>}
    </>
  );
}
