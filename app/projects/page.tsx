import { publicPageMetadata } from "@/lib/security/metadata";
import { getPublicIdentity, getProjectArchiveText } from "@/lib/dal/public";
import Link from "next/link";
import { SiteShell } from "@/components/site/shell";
import { ProjectCard } from "@/components/projects/project-card";
import { getPortfolioShell, getProjectIndex } from "@/lib/dal/public";
export async function generateMetadata() {
  const archive = await getProjectArchiveText();
  return publicPageMetadata(
    await getPublicIdentity(),
    "/projects",
    archive.title,
    archive.subtitle || "Explore published projects.",
  );
}
export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const [portfolio, allProjects, archive, query] = await Promise.all([
    getPortfolioShell(),
    getProjectIndex(),
    getProjectArchiveText(),
    searchParams,
  ]);
  const categories = [
    ...new Set(allProjects.map((p) => p.category).filter(Boolean)),
  ];
  const category = categories.includes(query.category ?? "")
    ? query.category
    : undefined;
  const projects = allProjects.filter(
    (p) => !category || p.category === category,
  );
  return (
    <SiteShell portfolio={portfolio}>
      <section className="section">
        <p className="eyebrow">Work / Project archive</p>
        <h1>{archive.title}</h1>
        <p className="lede">
          {archive.subtitle ||
            "Explore each project’s purpose, implementation and source."}
        </p>
        <nav className="filters" aria-label="Project categories">
          <Link href="/projects" aria-current={!category ? "page" : undefined}>
            All projects
          </Link>
          {categories.map((item) => (
            <Link
              key={item}
              href={`/projects?category=${encodeURIComponent(item)}`}
              aria-current={item === category ? "page" : undefined}
            >
              {item}
            </Link>
          ))}
        </nav>
        {projects.length ? (
          <div className="project-grid">
            {projects.map((project, index) => (
              <ProjectCard
                key={project.slug}
                project={project}
                index={index}
                eager={index < 2}
              />
            ))}
          </div>
        ) : (
          <p>No projects have been published yet.</p>
        )}
      </section>
    </SiteShell>
  );
}
