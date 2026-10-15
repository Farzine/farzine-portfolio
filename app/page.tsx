import { getPortfolio } from "@/lib/dal/portfolio";
import { portfolioMetadata } from "@/lib/content/metadata";
import { PortfolioFrame } from "@/components/site/portfolio-frame";
import { PortfolioSections } from "@/components/profile/sections";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  try {
    const portfolio = await getPortfolio();
    return portfolioMetadata(portfolio, {
      preview: portfolio.developmentPreview,
    });
  } catch {
    return {
      title: "Portfolio unavailable",
      robots: { index: false, follow: false },
    };
  }
}
export default async function Home() {
  const portfolio = await getPortfolio();
  return (
    <PortfolioFrame
      portfolio={portfolio}
      developmentPreview={portfolio.developmentPreview}
    >
      <PortfolioSections portfolio={portfolio} />
    </PortfolioFrame>
  );
}
