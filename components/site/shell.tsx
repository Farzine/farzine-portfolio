import Link from "next/link";
import type { PublicPortfolio } from "@/lib/validations/public-content";
export function SiteShell({
  children,
  portfolio,
}: {
  children: React.ReactNode;
  portfolio?: PublicPortfolio;
}) {
  const name = portfolio?.profile?.name ?? "Portfolio";
  const navigation =
    portfolio?.navigation.filter(
      (item) =>
        item.kind === "navigation" &&
        (!item.url.startsWith("/#") ||
          portfolio?.sections.some(
            (section) => item.url === `/#${section.key}`,
          )),
    ) ?? [];
  return (
    <>
      <header className="site-header wrap">
        <Link className="identity" href="/">
          {name}
          <span className="identity-mark" aria-hidden="true">
            {" "}
            /{" "}
          </span>
        </Link>
        <nav aria-label="Main navigation">
          {navigation.map((item) => (
            <Link key={item.url} href={item.url}>
              {item.label}
            </Link>
          ))}
        </nav>
      </header>
      {portfolio?.demo ? (
        <aside className="demo-notice wrap">
          Development preview · Legacy content awaiting owner review. No
          database writes are enabled.
        </aside>
      ) : null}
      <main id="main" className="wrap">
        {children}
      </main>
      <footer className="wrap footer">
        <span>{portfolio?.profile?.footer_text ?? name}</span>
        <Link href="/admin/login">Owner login</Link>
      </footer>
    </>
  );
}
