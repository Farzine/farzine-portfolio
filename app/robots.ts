import type { MetadataRoute } from "next";
import { getPortfolio } from "@/lib/dal/portfolio";
import { canonicalPage } from "@/lib/content/seo";
export const dynamic = "force-dynamic";
export default async function robots(): Promise<MetadataRoute.Robots> {
  try {
    const portfolio = await getPortfolio();
    if (portfolio.developmentPreview)
      return { rules: { userAgent: "*", disallow: "/" } };
    return {
      rules: {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/auth", "/legacy"],
      },
      sitemap: canonicalPage(portfolio, "/sitemap.xml"),
    };
  } catch {
    // Configuration/content outages must not make an error page indexable.
    return { rules: { userAgent: "*", disallow: "/" } };
  }
}
