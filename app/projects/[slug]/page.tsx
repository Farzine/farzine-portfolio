import { StructuredData } from "@/components/site/structured-data";
import { headers } from "next/headers";
import {
  publicPageMetadata,
  projectStructuredData,
  siteOrigin,
} from "@/lib/security/metadata";
import { getPublicIdentity } from "@/lib/dal/public";
import { ProjectDetail } from "@/components/projects/project-detail";
import { notFound, permanentRedirect } from "next/navigation";
import type { Metadata } from "next";
import { SiteShell } from "@/components/site/shell";
import {
  getPortfolioShell,
  getPublishedProject,
  getPublishedProjectGallery,
  getProjectRedirect,
} from "@/lib/dal/public";
type Props = { params: Promise<{ slug: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const project = await getPublishedProject((await params).slug);
  if (!project) {
    const redirect = await getProjectRedirect((await params).slug);
    if (redirect) permanentRedirect(redirect);
  }
  if (!project)
    return {
      title: "Project not found",
      robots: { index: false, follow: false },
    };
  return {
    ...publicPageMetadata(
      await getPublicIdentity(),
      `/projects/${project.slug}`,
      project.seo_title || project.title,
      project.seo_description || project.summary.slice(0, 320),
      project.cover_image,
    ),
    ...(project.seo_title ? { title: { absolute: project.seo_title } } : {}),
    robots: { index: true, follow: true },
  };
}
export default async function ProjectPage({ params }: Props) {
  const [portfolio, { slug }] = await Promise.all([
    getPortfolioShell(),
    params,
  ]);
  const project = await getPublishedProject(slug);
  if (!project) {
    const redirect = await getProjectRedirect(slug);
    if (redirect) permanentRedirect(redirect);
    notFound();
  }
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  return (
    <SiteShell portfolio={portfolio}>
      {siteOrigin() ? (
        <StructuredData nonce={nonce} data={projectStructuredData(project)} />
      ) : null}
      <ProjectDetail
        project={project}
        gallery={await getPublishedProjectGallery(slug)}
      />
    </SiteShell>
  );
}
