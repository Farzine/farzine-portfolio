import Link from "next/link";
import { getAdminProjects } from "@/lib/dal/admin";
export default async function Overview() {
  const projects = await getAdminProjects();
  const recent = [...projects]
    .sort((a, b) => b.updated_at.localeCompare(a.updated_at))
    .slice(0, 5);
  return (
    <>
      <p className="eyebrow">Content / Overview</p>
      <h1>Your portfolio workspace.</h1>
      <div className="admin-counts">
        {(["draft", "published", "archived"] as const).map((status) => (
          <div key={status}>
            <strong>
              {projects.filter((project) => project.status === status).length}
            </strong>
            <span>{status} projects</span>
          </div>
        ))}
      </div>
      <p className="muted">
        Publish reviewed content when it is ready. Drafts and archived projects
        stay private.
      </p>
      <h2>Recently updated projects</h2>
      {recent.length ? (
        <ul className="admin-list">
          {recent.map((project) => (
            <li key={project.id}>
              <Link href={`/admin/projects/${project.id}`}>
                {project.title}
              </Link>
              <span className="muted small">{project.status}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p>No projects yet.</p>
      )}
      <Link className="button" href="/admin/projects/new">
        Create project
      </Link>
    </>
  );
}
