import { getPortfolioShell } from "@/lib/dal/public";
import Link from "next/link";
import { SiteShell } from "@/components/site/shell";
export default async function NotFound() {
  return (
    <SiteShell portfolio={await getPortfolioShell()}>
      <section className="section">
        <p className="eyebrow">404 / Page not found</p>
        <h1>This path ends here.</h1>
        <p>The page may have moved or is not public.</p>
        <Link className="button" href="/">
          Back to the profile
        </Link>
      </section>
    </SiteShell>
  );
}
