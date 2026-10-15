import Image from "next/image";
import Link from "next/link";
import type {
  PublicProject,
  PublicGalleryImage,
} from "@/lib/validations/public-content";
export function ProjectDetail({
  project,
  gallery = [],
  backHref = "/projects",
  backLabel = "All projects",
}: {
  project: PublicProject;
  gallery?: PublicGalleryImage[];
  backHref?: string;
  backLabel?: string;
}) {
  return (
    <article className="section project-detail">
      <Link className="text-link" href={backHref}>
        ← {backLabel}
      </Link>
      <p className="eyebrow">Project / {project.category}</p>
      <h1>{project.title}</h1>
      <p className="lede">{project.summary}</p>
      <ul className="skill-list">
        {[...new Set(project.technologies)].map((technology) => (
          <li key={technology}>{technology}</li>
        ))}
      </ul>
      {project.cover_image ? (
        <Image
          className="detail-cover"
          src={project.cover_image}
          alt={project.cover_alt || `${project.title} screenshot`}
          width={1270}
          height={600}
          sizes="(max-width:959px) 90vw, 1100px"
          preload
        />
      ) : null}
      <div className="project-story">
        <p className="prose">{project.details}</p>
      </div>
      <div className="link-row">
        {project.demo_url ? (
          <a
            className="button"
            href={project.demo_url}
            rel="noopener noreferrer"
          >
            Visit project ↗
          </a>
        ) : null}
        {project.repository_url ? (
          <a
            className="button secondary"
            href={project.repository_url}
            rel="noopener noreferrer"
          >
            Source code ↗
          </a>
        ) : null}
        {project.download_url ? (
          <a
            className="button secondary"
            href={project.download_url}
            rel="noopener noreferrer"
          >
            Download ↗
          </a>
        ) : null}
      </div>
      {gallery.length ? (
        <section className="project-gallery" aria-label="Project screenshots">
          {gallery.map((image) => (
            <figure key={image.src}>
              <Image
                src={image.src}
                alt={image.alt}
                width={image.width}
                height={image.height}
                sizes="(max-width: 639px) 90vw, 70vw"
              />
              <figcaption className="muted small">{image.caption}</figcaption>
            </figure>
          ))}
        </section>
      ) : null}
    </article>
  );
}
