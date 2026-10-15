import { headers } from "next/headers";
import type { Portfolio, PublicProject } from "@/lib/content/public-model";
import {
  serializeStructuredData,
  structuredPortfolio,
} from "@/lib/content/seo";

export async function StructuredData({
  portfolio,
  project,
}: {
  portfolio: Portfolio;
  project?: PublicProject;
}) {
  if ("developmentPreview" in portfolio && portfolio.developmentPreview)
    return null;
  const nonce = (await headers()).get("x-nonce") || undefined;
  return (
    <script nonce={nonce} type="application/ld+json">
      {serializeStructuredData(structuredPortfolio(portfolio, project))}
    </script>
  );
}
