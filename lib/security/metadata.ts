import type { Metadata } from "next";
import type {
  PublicProfile,
  PublicProject,
} from "@/lib/validations/public-content";
export function siteOrigin(value = process.env.SITE_URL): string | undefined {
  if (!value) return undefined;
  const url = new URL(value);
  if (
    !["http:", "https:"].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    url.pathname !== "/"
  )
    throw new Error(
      "SITE_URL must be an http(s) origin without credentials, a path or query.",
    );
  return url.origin;
}
export function absoluteUrl(path: string) {
  const origin = siteOrigin();
  return origin ? new URL(path, origin).href : undefined;
}
export function serializeJsonLd(value: Record<string, unknown>) {
  return JSON.stringify(value).replace(
    /[<>&\u2028\u2029]/g,
    (char) => `\\u${char.charCodeAt(0).toString(16).padStart(4, "0")}`,
  );
}
export function publicPageMetadata(
  profile: PublicProfile | null,
  path: string,
  title: string,
  description: string,
  image?: string,
): Metadata {
  const origin = siteOrigin();
  const url = origin ? new URL(path, origin).href : undefined;
  const preview =
    image || profile?.social_preview_image || profile?.profile_image;
  const images =
    preview && origin
      ? [{ url: new URL(preview, origin).href, alt: title }]
      : undefined;
  return {
    title,
    description,
    alternates: url ? { canonical: url } : undefined,
    openGraph: {
      type: "website",
      title,
      description,
      url,
      siteName: profile?.name || "Portfolio",
      images,
    },
    twitter: {
      card: images ? "summary_large_image" : "summary",
      title,
      description,
      images: images?.map((image) => image.url),
    },
  };
}
export function projectStructuredData(project: PublicProject) {
  return {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: project.title,
    description: project.summary,
    url: absoluteUrl(`/projects/${project.slug}`),
    ...(project.cover_image ? { image: absoluteUrl(project.cover_image) } : {}),
  };
}
