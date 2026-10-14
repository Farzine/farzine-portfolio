import Link from "next/link";
import { SiteShell } from "@/components/site/shell";
export default function NotFound() {
  return (
    <SiteShell>
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
