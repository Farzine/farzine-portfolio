import { connection } from "next/server";
import type { MetadataRoute } from "next";
import { getPublishedProjects, getPublicIdentity } from "@/lib/dal/public";
import { absoluteUrl, siteOrigin } from "@/lib/security/metadata";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  await connection();
  if (!siteOrigin()) return [];
  const [profile, projects] = await Promise.all([
    getPublicIdentity(),
    getPublishedProjects(),
  ]);
  if (!profile && !projects.length) return [];
  return [
    ...(profile ? [{ url: absoluteUrl("/") ?? "" }] : []),
    { url: absoluteUrl("/projects") ?? "" },
    ...projects.map((project) => ({
      url: absoluteUrl(`/projects/${project.slug}`) ?? "",
    })),
  ];
}
