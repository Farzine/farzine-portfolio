import Image from "next/image";
import Link from "next/link";
import type { PublicProjectCard } from "@/lib/validations/public-content";
export function ProjectCard({
  project,
  index,
  eager = false,
}: {
  project: PublicProjectCard;
  index: number;
  eager?: boolean;
}) {
  return (
    <article className="project-card">
      <Link
        className="project-image"
        href={`/projects/${project.slug}`}
        aria-label={`Explore ${project.title}`}
      >
        {project.cover_image ? (
          <Image
            className="project-cover"
            src={project.cover_image}
            alt={project.cover_alt || `${project.title} screenshot`}
            width={1270}
            height={600}
            loading={eager ? "eager" : "lazy"}
            sizes="(max-width: 639px) 90vw, (max-width: 959px) 45vw, 40vw"
          />
        ) : (
          <span className="image-placeholder" aria-hidden="true">
            {project.title.slice(0, 1)}
          </span>
        )}
      </Link>
      <div className="project-meta">
        <span>
          {String(index + 1).padStart(2, "0")} / {project.category || "Project"}
        </span>
        <span>{project.technologies.slice(0, 2).join(" · ")}</span>
      </div>
      <h3>
        <Link href={`/projects/${project.slug}`}>
          {project.title}
          <span className="project-arrow" aria-hidden="true">
            {" "}
            ↗
          </span>
        </Link>
      </h3>
      <p>{project.summary}</p>
    </article>
  );
}
