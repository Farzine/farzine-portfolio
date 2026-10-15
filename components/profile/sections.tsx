import { textItems } from "@/lib/content/text-items";
import { SkillGroup } from "./skill-group";
import type { Portfolio } from "@/lib/content/public-model";
import { Media } from "@/components/site/media";
import {
  EmptySection,
  SectionHeading,
} from "@/components/site/section-heading";
import { SocialLinks } from "@/components/site/social-links";
import { Projects } from "@/components/projects/projects";

const interestIcons: Record<string, string> = {
  global: "ri-global-line",
  code: "ri-code-s-slash-fill",
  database: "ri-database-2-line",
  camera: "ri-camera-3-line",
  language: "ri-english-input",
  robot: "ri-robot-line",
  algorithm: "ri-file-list-3-line",
  image: "ri-image-line",
};
const factIcons: Record<string, string> = {
  info: "bx-info-circle",
  map: "bx-map",
  email: "bx-envelope",
  phone: "bx-phone-call",
};
function TextLink({
  url,
  children,
  newTab = false,
}: {
  url: string | null;
  children: React.ReactNode;
  newTab?: boolean;
}) {
  return url ? (
    <a
      href={url}
      target={newTab ? "_blank" : undefined}
      rel="noopener noreferrer"
    >
      {children}
    </a>
  ) : (
    children
  );
}
function Bullets({ items }: { items: string[] }) {
  return items.length ? (
    <ul>
      {textItems(items).map((item) => (
        <li key={item.key}>{item.text}</li>
      ))}
    </ul>
  ) : null;
}

export function PortfolioSections({
  portfolio,
  projectsOnly = false,
  category = "",
}: {
  portfolio: Portfolio;
  projectsOnly?: boolean;
  category?: string;
}) {
  const { settings, copy } = portfolio;
  function sectionContent(key: string): React.ReactNode {
    switch (key) {
      case "about":
        return (
          <div className="about-grid">
            <Media media={settings.portrait} />
            <div className="about-copy">
              <p>{settings.biography}</p>
              <ul className="profile-facts">
                {portfolio.facts
                  .filter((fact) => fact.placement === "about")
                  .map((fact) => (
                    <li key={fact.id}>
                      <i className="bx bx-chevron-right" aria-hidden="true" />
                      <strong>{fact.label}:</strong> {fact.value}
                    </li>
                  ))}
              </ul>
            </div>
          </div>
        );
      case "interests":
        return portfolio.interests.length ? (
          <div className="interest-grid">
            {portfolio.interests.map((interest) => (
              <article className="interest-card" key={interest.id}>
                <i
                  className={interestIcons[interest.icon] || "ri-global-line"}
                  aria-hidden="true"
                  style={{ color: interest.color }}
                />
                <h3>{interest.name}</h3>
              </article>
            ))}
          </div>
        ) : (
          <EmptySection text={copy.empty} />
        );
      case "education":
        return portfolio.education.length ? (
          <div className="education-grid">
            {portfolio.education.map((entry) => (
              <article className="education-card" key={entry.id}>
                <TextLink url={entry.url} newTab>
                  <Media media={entry.image} />
                </TextLink>
                <p>
                  <em>{entry.qualification}</em>
                </p>
                <p className="entry-date">{entry.date}</p>
                {entry.institution && <p>{entry.institution}</p>}
                {entry.description && <p>{entry.description}</p>}
              </article>
            ))}
          </div>
        ) : (
          <EmptySection text={copy.empty} />
        );
      case "certifications":
        return portfolio.certifications.length ? (
          <div className="certificate-grid">
            {portfolio.certifications.map((entry) => (
              <article
                key={entry.id}
                className={`certificate-card${entry.url ? "" : " no-link"}`}
              >
                <TextLink url={entry.url} newTab>
                  <Media media={entry.image} />
                  <span
                    className={`certificate-caption${entry.image ? "" : " no-cover"}`}
                  >
                    <span>{entry.name}</span>
                    {entry.url && (
                      <i className="bx bx-link" aria-hidden="true" />
                    )}
                  </span>
                </TextLink>
                {entry.issuer && <p>{entry.issuer}</p>}
                {entry.date && <p>{entry.date}</p>}
              </article>
            ))}
          </div>
        ) : (
          <EmptySection text={copy.empty} />
        );
      case "experience":
        return portfolio.experience.length ? (
          <div className="editorial-list">
            {portfolio.experience.map((entry) => (
              <article className="editorial-card" key={entry.id}>
                <h3>
                  <TextLink url={entry.url}>{entry.organization}</TextLink>
                </h3>
                <p className="entry-date">{entry.date}</p>
                <p className="entry-role">
                  <em>{entry.role}</em>
                </p>
                <Bullets items={entry.bullets} />
              </article>
            ))}
          </div>
        ) : (
          <EmptySection text={copy.empty} />
        );
      case "achievements":
        return portfolio.achievements.length ? (
          <div className="editorial-list">
            {portfolio.achievements.map((entry) => (
              <article className="editorial-card" key={entry.id}>
                <h3>
                  <TextLink url={entry.url}>{entry.title}</TextLink>
                </h3>
                {entry.date && <p className="entry-date">{entry.date}</p>}
                {entry.result && (
                  <p className="entry-role">
                    <em>{entry.result}</em>
                  </p>
                )}
                <Bullets items={entry.bullets} />
              </article>
            ))}
          </div>
        ) : (
          <EmptySection text={copy.empty} />
        );
      case "portfolio":
        return (
          <Projects
            copy={copy}
            projects={portfolio.projects}
            allLabel={
              portfolio.sections.find((section) => section.key === key)
                ?.allLabel || "All"
            }
            category={category}
          />
        );
      case "skills":
        return portfolio.skillGroups.length ? (
          <div className="skill-groups">
            {portfolio.skillGroups.map((group) => (
              <SkillGroup key={group.id} group={group} />
            ))}
          </div>
        ) : (
          <EmptySection text={copy.empty} />
        );
      case "links":
        return portfolio.documents.length ? (
          <div className="document-grid">
            {portfolio.documents.map((entry) => (
              <article className="document-card" key={entry.id}>
                <a href={entry.url} target="_blank" rel="noopener noreferrer">
                  <i className="bx bx-file" aria-hidden="true" />
                  <h3>{entry.title}</h3>
                </a>
                <p>{entry.description}</p>
              </article>
            ))}
          </div>
        ) : (
          <EmptySection text={copy.empty} />
        );
      case "contacts": {
        const facts = portfolio.facts.filter(
          (fact) => fact.placement === "contact",
        );
        const socials = portfolio.socials.filter((link) =>
          ["contact", "both"].includes(link.placement),
        );
        if (!facts.length && !socials.length)
          return <EmptySection text={copy.empty} />;
        const boxes = facts.map((fact) => (
          <article className="contact-card" key={fact.id}>
            <i
              className={`bx ${factIcons[fact.icon] || factIcons.info}`}
              aria-hidden="true"
            />
            <h3>{fact.label}</h3>
            {textItems(fact.value.split("\n")).map((item) => (
              <p key={item.key}>{item.text}</p>
            ))}
          </article>
        ));
        if (socials.length)
          boxes.splice(
            Math.min(1, boxes.length),
            0,
            <article className="contact-card" key="social">
              <i className="bx bx-share-alt" aria-hidden="true" />
              <h3>{settings.socialHeading}</h3>
              <SocialLinks links={socials} label={copy.socialNav} />
            </article>,
          );
        return <div className="contact-grid">{boxes}</div>;
      }
      default:
        return null;
    }
  }
  const mainSections = portfolio.sections.filter(
    (section) =>
      section.key !== "header" &&
      !section.parentKey &&
      (!projectsOnly || section.key === "portfolio"),
  );
  return mainSections.map((section) => (
    <section
      key={section.key}
      id={section.key}
      className={`portfolio-section${projectsOnly ? " is-initial" : ""}`}
      aria-labelledby={`title-${section.key}`}
    >
      {[
        section,
        ...portfolio.sections.filter(
          (child) => child.parentKey === section.key,
        ),
      ].map((group) => (
        <div
          className={`container section-content content-${group.key}`}
          key={group.key}
        >
          <SectionHeading title={group.title} id={`title-${group.key}`} />
          {sectionContent(group.key)}
        </div>
      ))}
      {settings.footer && (
        <footer className="container section-footer">{settings.footer}</footer>
      )}
    </section>
  ));
}
