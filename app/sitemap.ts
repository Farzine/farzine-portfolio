import type { MetadataRoute } from "next";
import { getPortfolio } from "@/lib/dal/portfolio";
import { sitemapUrls } from "@/lib/content/seo";
export const dynamic = "force-dynamic";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const portfolio = await getPortfolio();
  return portfolio.developmentPreview
    ? []
    : sitemapUrls(portfolio).map((url) => ({ url }));
}
