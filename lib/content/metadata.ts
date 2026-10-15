import type { Metadata } from "next";
import type { Portfolio, PublicProject } from "./public-model";

export function portfolioMetadata(
  portfolio: Portfolio,
  {
    project,
    projectsPage = false,
    preview = false,
  }: {
    project?: PublicProject;
    projectsPage?: boolean;
    preview?: boolean;
  } = {},
): Metadata {
  const { settings } = portfolio;
  const title = project?.seoTitle || project?.detailTitle || settings.seoTitle;
  const description =
    project?.seoDescription || project?.summary || settings.seoDescription;
  const canonical = settings.canonicalUrl
    ? new URL(
        project
          ? `/projects/${project.slug}`
          : projectsPage
            ? "/projects"
            : "/",
        settings.canonicalUrl,
      ).href
    : undefined;
  const image = project?.cover || settings.seoImage || settings.portrait;
  return {
    title,
    description,
    alternates: canonical ? { canonical } : undefined,
    robots: preview ? { index: false, follow: false } : undefined,
    icons: settings.icon
      ? { icon: settings.icon.src }
      : { icon: "/favicon.ico" },
    openGraph: {
      title,
      description,
      type: "website",
      url: canonical,
      siteName: settings.name,
      images: image
        ? [
            {
              url: canonical ? new URL(image.src, canonical).href : image.src,
              alt: image.alt,
              width: image.width,
              height: image.height,
            },
          ]
        : [],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      creator: settings.twitterHandle || undefined,
    },
  };
}
