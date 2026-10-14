import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { SiteShell } from "@/components/site/shell";
import { getPortfolioProfile, getPublishedProject } from "@/lib/dal/public";
export const dynamic = "force-dynamic";
type Props = { params: Promise<{ slug: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const project = await getPublishedProject((await params).slug);
  if (!project)
    return {
      title: "Project not found",
      robots: { index: false, follow: false },
    };
  return {
    title: project.seo_title || project.title,
    description: project.seo_description || project.summary.slice(0, 320),
  };
}
export default async function ProjectPage({ params }: Props) {
  const [portfolio, { slug }] = await Promise.all([
    getPortfolioProfile(),
    params,
  ]);
  const project = portfolio.projects.find((p) => p.slug === slug);
  if (!project) notFound();
  return (
    <SiteShell portfolio={portfolio}>
      <article className="section project-detail">
        <Link className="text-link" href="/projects">
          ← All projects
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
            sizes="(max-width: 959px) 90vw, 1100px"
            preload
          />
        ) : null}
        <div className="project-story">
          {[...new Set(project.details.split(/\n\s*\n/).filter(Boolean))].map(
            (paragraph) => (
              <p className="prose" key={paragraph}>
                {paragraph}
              </p>
            ),
          )}
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
      </article>
    </SiteShell>
  );
}
