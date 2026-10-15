import { textItems } from "@/lib/content/text-items";
import type { PublicProject } from "@/lib/content/public-model";
import { Media } from "@/components/site/media";

export function ProjectDetails({
  project,
  heading = "h1",
}: {
  project: PublicProject;
  heading?: "h1" | "h2";
}) {
  const Heading = heading;
  return (
    <article className="project-details">
      <Heading className="project-detail-title">{project.detailTitle}</Heading>
      <ul className="project-facts">
        {!!project.technologies.length && (
          <li>
            <strong>Tech Stack</strong>: {project.technologies.join(", ")}
          </li>
        )}
        {project.demoUrl && (
          <li>
            <strong>Website URL</strong>:{" "}
            <a href={project.demoUrl} target="_blank" rel="noopener noreferrer">
              {new URL(project.demoUrl).hostname}
            </a>
          </li>
        )}
        {project.sourceUrl && (
          <li>
            <strong>Github URL</strong>:{" "}
            <a
              href={project.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              Project Link
            </a>
          </li>
        )}
        {project.downloadUrl && (
          <li>
            <strong>APK File</strong>:{" "}
            <a
              href={project.downloadUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              Download
            </a>
          </li>
        )}
      </ul>
      {textItems(
        (project.paragraphs.length
          ? project.paragraphs
          : [project.summary]
        ).filter(Boolean),
      ).map((item) => (
        <p key={item.key}>{item.text}</p>
      ))}
      {!!project.gallery.length && (
        <div className="project-gallery">
          {project.gallery.map((item) => (
            <figure key={item.image.src}>
              <Media
                media={item.image}
                sizes="(min-width: 1200px) 1080px, 90vw"
              />
              {item.caption && <figcaption>{item.caption}</figcaption>}
            </figure>
          ))}
        </div>
      )}
    </article>
  );
}
