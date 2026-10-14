import Link from "next/link";
import { SiteShell } from "@/components/site/shell";
import { ProjectCard } from "@/components/projects/project-card";
import { getPortfolioProfile } from "@/lib/dal/public";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "Projects",
  description: "Explore software development and machine learning projects.",
};
export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const [portfolio, query] = await Promise.all([
    getPortfolioProfile(),
    searchParams,
  ]);
  const categories = [
    ...new Set(portfolio.projects.map((p) => p.category).filter(Boolean)),
  ];
  const category = categories.includes(query.category ?? "")
    ? query.category
    : undefined;
  const projects = portfolio.projects.filter(
    (p) => !category || p.category === category,
  );
  return (
    <SiteShell portfolio={portfolio}>
      <section className="section">
        <p className="eyebrow">Work / Project archive</p>
        <h1>Work, in context.</h1>
        <p className="lede">
          Explore each project’s purpose, implementation and source.
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
              <ProjectCard key={project.slug} project={project} index={index} />
            ))}
          </div>
        ) : (
          <p>No projects have been published yet.</p>
        )}
      </section>
    </SiteShell>
  );
}
