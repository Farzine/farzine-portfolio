import { getPortfolio } from "@/lib/dal/portfolio";
import { portfolioMetadata } from "@/lib/content/metadata";
import { PortfolioFrame } from "@/components/site/portfolio-frame";
import { PortfolioSections } from "@/components/profile/sections";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";
export async function generateMetadata() {
  try {
    const portfolio = await getPortfolio();
    return portfolioMetadata(portfolio, {
      projectsPage: true,
      preview: portfolio.developmentPreview,
    });
  } catch {
    return {
      title: "Portfolio unavailable",
      robots: { index: false, follow: false },
    };
  }
}
export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string | string[] }>;
}) {
  const portfolio = await getPortfolio();
  if (
    !portfolio.sections.some(
      (section) => section.key === "portfolio" && !section.parentKey,
    )
  )
    notFound();
  const { category } = await searchParams;
  return (
    <PortfolioFrame
      portfolio={portfolio}
      projectsPage
      developmentPreview={portfolio.developmentPreview}
    >
      <PortfolioSections
        portfolio={portfolio}
        projectsOnly
        category={typeof category === "string" ? category : ""}
      />
    </PortfolioFrame>
  );
}
