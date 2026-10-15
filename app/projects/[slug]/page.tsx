import { StructuredData } from "@/components/site/structured-data";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { getPortfolio, getPublishedProject } from "@/lib/dal/portfolio";
import { portfolioMetadata } from "@/lib/content/metadata";
import { ProjectDetails } from "@/components/projects/project-details";
import { ThemeToggle } from "@/components/site/theme-toggle";

export const dynamic = "force-dynamic";
function normalizeLegacySlug(slug: string) {
  return /^[A-Za-z0-9-]+\.html$/.test(slug)
    ? slug.slice(0, -5).toLowerCase()
    : slug;
}
type Props = { params: Promise<{ slug: string }> };
export async function generateMetadata({ params }: Props) {
  try {
    const project = await getPublishedProject(
      normalizeLegacySlug((await params).slug),
    );
    if (!project)
      return {
        title: "Page not found",
        robots: { index: false, follow: false },
      };
    const portfolio = await getPortfolio();
    return portfolioMetadata(portfolio, {
      project,
      preview: portfolio.developmentPreview,
    });
  } catch {
    return {
      title: "Portfolio unavailable",
      robots: { index: false, follow: false },
    };
  }
}
export default async function ProjectPage({ params }: Props) {
  const slug = (await params).slug;
  const project = await getPublishedProject(normalizeLegacySlug(slug));
  if (!project) notFound();
  if (slug !== project.slug) permanentRedirect(`/projects/${project.slug}`);
  const portfolio = await getPortfolio();
  const { copy } = portfolio;
  return (
    <main id="main" className="container project-page" tabIndex={-1}>
      <Link className="back-link" href="/#portfolio">
        {copy.backProjects}
      </Link>
      <StructuredData portfolio={portfolio} project={project} />
      <ProjectDetails project={project} copy={copy} />
      <ThemeToggle copy={copy} />
    </main>
  );
}
