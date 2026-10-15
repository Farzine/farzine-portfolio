import type { ReactNode } from "react";
import type { Portfolio } from "@/lib/content/public-model";
import { Navigation } from "./navigation";
import { SocialLinks } from "./social-links";

export function PortfolioFrame({
  portfolio,
  children,
  projectsPage = false,
  developmentPreview = false,
}: {
  portfolio: Portfolio;
  children: ReactNode;
  projectsPage?: boolean;
  developmentPreview?: boolean;
}) {
  const { settings } = portfolio;
  return (
    <div className={`site-shell${projectsPage ? " projects-page" : ""}`}>
      <header id="header" className="home-header">
        <div className="container">
          <h1 className="home-name" tabIndex={-1}>
            <a href="/#header">{settings.name}</a>
          </h1>
          <div className="home-introduction">
            {!!settings.roles.length && (
              <p className="home-role">
                {settings.rolePrefix} <span>{settings.roles[0]}</span>
              </p>
            )}
          </div>
          <Navigation
            items={portfolio.navigation}
            copy={portfolio.copy}
            initialSection={projectsPage ? "portfolio" : "header"}
          />
          <div className="home-extras">
            <SocialLinks
              label={portfolio.copy.socialNav}
              links={portfolio.socials.filter((link) =>
                ["hero", "both"].includes(link.placement),
              )}
            />
            {settings.updatedDisplay && (
              <p className="site-stats">
                <i className="bx bx-calendar" aria-hidden="true" />{" "}
                {settings.updatedLabel} <span>{settings.updatedDisplay}</span>
              </p>
            )}
            {(settings.primaryCta.href || settings.secondaryCta.href) && (
              <div className="hero-actions">
                {[settings.primaryCta, settings.secondaryCta].map((cta) =>
                  cta.href && cta.label ? (
                    <a key={cta.href} href={cta.href}>
                      {cta.label}
                    </a>
                  ) : null,
                )}
              </div>
            )}
          </div>
        </div>
      </header>
      <main id="main" tabIndex={-1}>
        {children}
      </main>
      {settings.footer && (
        <footer className="site-footer container">{settings.footer}</footer>
      )}
      {developmentPreview && (
        <aside className="development-notice">
          Historical preview · local only
        </aside>
      )}
    </div>
  );
}
