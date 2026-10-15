import Link from "next/link";
import { Navigation } from "@/components/site/navigation";
import { legacyHome } from "@/lib/legacy-home";

export default function Home() {
  return (
    <main id="main" tabIndex={-1}>
      <header id="header" className="home-header">
        <div className="container">
          <h1 className="home-name">
            <Link href="/">{legacyHome.name}</Link>
          </h1>
          <h2 className="home-role">
            I'm <span>{legacyHome.role}</span>
          </h2>
          <Navigation />
          <nav className="social-links" aria-label="Social links">
            {legacyHome.socials.map((social) => (
              <a
                key={social.label}
                href={social.href}
                rel="noopener noreferrer"
              >
                <i className={`bx ${social.icon}`} aria-hidden="true" />
                <span className="sr-only">{social.label}</span>
              </a>
            ))}
          </nav>
          <p className="site-stats">
            <i className="bx bx-calendar" aria-hidden="true" />{" "}
            {legacyHome.updatedLabel} <span>{legacyHome.updated}</span>
          </p>
        </div>
      </header>
    </main>
  );
}
