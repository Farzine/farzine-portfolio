import type { PublicProject } from "@/lib/content/public-model";
import { EmptySection } from "@/components/site/section-heading";
import { Media } from "@/components/site/media";
import { ProjectDetails } from "./project-details";
import { ProjectGrid } from "./project-grid";
import { ProjectLink } from "./project-link";

export function Projects({
  projects,
  allLabel,
  category = "",
}: {
  projects: PublicProject[];
  allLabel: string;
  category?: string;
}) {
  if (!projects.length) return <EmptySection />;
  const categories = [
    ...new Set(projects.map((project) => project.category).filter(Boolean)),
  ];
  const selected = categories.includes(category) ? category : "";
  return (
    <ProjectGrid
      categories={categories}
      allLabel={allLabel}
      initialCategory={selected}
    >
      {projects.map((project) => (
        <article
          key={project.id}
          className="project-card"
          data-category={project.category}
          hidden={!!selected && project.category !== selected}
        >
          <h3 className="project-card-title">{project.title}</h3>
          <ProjectLink
            href={`/projects/${project.slug}`}
            title={project.title}
            details={<ProjectDetails project={project} heading="h2" />}
          >
            {project.cover ? (
              <Media media={project.cover} />
            ) : (
              <span className="media-placeholder">{project.title}</span>
            )}
            <span className="image-overlay" aria-hidden="true">
              <i className="bx bx-info-circle" />
            </span>
          </ProjectLink>
        </article>
      ))}
    </ProjectGrid>
  );
}
