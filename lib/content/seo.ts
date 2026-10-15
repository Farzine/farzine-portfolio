import type { Portfolio, PublicProject } from "./public-model";

export function canonicalPage(portfolio: Portfolio, path = "/") {
  return portfolio.settings.canonicalUrl
    ? new URL(path, portfolio.settings.canonicalUrl).href
    : undefined;
}
export function sitemapUrls(portfolio: Portfolio): string[] {
  if (!portfolio.settings.canonicalUrl) return [];
  const paths = [
    "/",
    ...(portfolio.sections.some((s) => s.key === "portfolio")
      ? ["/projects"]
      : []),
    ...portfolio.projects.map((p) => `/projects/${p.slug}`),
  ];
  return paths.map(
    (path) => new URL(path, portfolio.settings.canonicalUrl || "").href,
  );
}
export function structuredPortfolio(
  portfolio: Portfolio,
  project?: PublicProject,
) {
  const url = canonicalPage(portfolio);
  const person = {
    "@type": "Person",
    ...(url ? { "@id": `${url}#person`, url } : {}),
    name: portfolio.settings.fullName || portfolio.settings.name,
    description: portfolio.settings.seoDescription || undefined,
    image: portfolio.settings.portrait
      ? url
        ? new URL(portfolio.settings.portrait.src, url).href
        : portfolio.settings.portrait.src
      : undefined,
    sameAs: portfolio.socials
      .filter((link) => /^https?:/.test(link.url))
      .map((link) => link.url),
  };
  return {
    "@context": "https://schema.org",
    "@graph": [
      person,
      ...(project
        ? [
            {
              "@type": "CreativeWork",
              name: project.detailTitle,
              description:
                project.seoDescription || project.summary || undefined,
              url: canonicalPage(portfolio, `/projects/${project.slug}`),
              author: url
                ? { "@id": `${url}#person` }
                : { "@type": "Person", name: person.name },
              image: project.cover
                ? url
                  ? new URL(project.cover.src, url).href
                  : project.cover.src
                : undefined,
            },
          ]
        : [
            {
              "@type": "WebSite",
              name: portfolio.settings.name,
              url,
              description: portfolio.settings.seoDescription || undefined,
            },
          ]),
    ],
  };
}
// JSON-LD remains data even if an authorized editor enters a script terminator.
export function serializeStructuredData(value: unknown): string {
  return JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}
