import Link from "next/link";
import { legacyHome } from "@/lib/legacy-home";

function NavigationLinks() {
  return (
    <ul>
      {legacyHome.navigation.map((item) => (
        <li key={item.label}>
          <Link
            href={item.href}
            aria-current={item.current ? "page" : undefined}
          >
            {item.label}
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function Navigation() {
  return (
    <>
      <nav className="desktop-navigation" aria-label="Main">
        <NavigationLinks />
      </nav>
      <details className="mobile-navigation">
        <summary aria-label="Open navigation">
          <span aria-hidden="true">☰</span>
        </summary>
        <nav aria-label="Mobile">
          <NavigationLinks />
        </nav>
      </details>
    </>
  );
}
