import { SocialIcon } from "@/components/ui/social-icon";
import { ContactForm } from "@/components/contact/contact-form";
import { contactAvailable } from "@/lib/dal/contact";
import Image from "next/image";
import Link from "next/link";
import { ProjectCard } from "@/components/projects/project-card";
import type {
  PublicPortfolio,
  PublicSection,
} from "@/lib/validations/public-content";
export function ProfileSection({
  section,
  portfolio,
  index,
}: {
  section: PublicSection;
  portfolio: PublicPortfolio;
  index: number;
}) {
  let content: React.ReactNode;
  switch (section.key) {
    case "about":
      content = (
        <>
          <p className="lede prose">{portfolio.profile?.biography}</p>
          <dl className="facts">
            {portfolio.facts
              .filter((f) => f.kind === "text")
              .map((fact) => (
                <div key={`${fact.label}-${fact.value}`}>
                  <dt>{fact.label}</dt>
                  <dd>{fact.value}</dd>
                </div>
              ))}
          </dl>
        </>
      );
      break;
    case "projects": {
      const selected = portfolio.projects.some((p) => p.featured)
        ? portfolio.projects.filter((p) => p.featured)
        : portfolio.projects.slice(0, 4);
      content = (
        <>
          <div className="project-grid">
            {selected.map((project, i) => (
              <ProjectCard key={project.slug} project={project} index={i} />
            ))}
          </div>
          <Link className="text-link" href="/projects">
            Explore all projects <span aria-hidden="true">↗</span>
          </Link>
        </>
      );
      break;
    }
    case "experience":
      content = (
        <div className="timeline">
          {portfolio.experiences.map((item) => (
            <article
              className="timeline-item"
              key={`${item.organization}-${item.role}-${item.date_label}`}
            >
              <p className="timeline-date">{item.date_label}</p>
              <div>
                <h3>{item.role}</h3>
                <p>
                  {item.url ? (
                    <a href={item.url} rel="noopener noreferrer">
                      {item.organization} ↗
                    </a>
                  ) : (
                    item.organization
                  )}
                  {item.location ? ` · ${item.location}` : ""}
                </p>
                <ul>
                  {[...new Set(item.bullets)].map((bullet) => (
                    <li key={bullet}>{bullet}</li>
                  ))}
                </ul>
              </div>
            </article>
          ))}
        </div>
      );
      break;
    case "skills":
      content = (
        <div className="skill-groups">
          {portfolio.skillGroups.map((group) => (
            <article key={group.name}>
              <h3>{group.name}</h3>
              <ul className="skill-list">
                {group.skills.map((skill) => (
                  <li key={skill.name}>
                    {skill.name}
                    {skill.description ? (
                      <span className="skill-description">
                        {skill.description}
                      </span>
                    ) : null}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      );
      break;
    case "education":
      content = (
        <div className="editorial-list">
          {portfolio.education.map((item) => (
            <article
              key={`${item.institution}-${item.qualification}-${item.date_label}`}
            >
              <div>
                <p className="eyebrow small">{item.date_label}</p>
                <h3>{item.qualification}</h3>
                <p>
                  {item.url ? (
                    <a href={item.url} rel="noopener noreferrer">
                      {item.institution} ↗
                    </a>
                  ) : (
                    item.institution
                  )}
                </p>
                {item.description ? (
                  <p className="prose">{item.description}</p>
                ) : null}
              </div>
              {item.image ? (
                <Image
                  src={item.image}
                  alt={item.institution}
                  width={660}
                  height={251}
                  sizes="(max-width: 639px) 85vw, 260px"
                />
              ) : null}
            </article>
          ))}
        </div>
      );
      break;
    case "certifications":
      content = (
        <div className="certificate-grid">
          {portfolio.certifications.map((item) => (
            <article key={`${item.name}-${item.credential_url}`}>
              {item.image ? (
                <Image
                  src={item.image}
                  alt={item.name}
                  width={640}
                  height={480}
                  sizes="(max-width: 639px) 85vw, (max-width: 959px) 42vw, 28vw"
                  className="certificate-image"
                />
              ) : null}
              <h3>{item.name}</h3>
              {item.issuer || item.date_label ? (
                <p>
                  {[item.issuer, item.date_label].filter(Boolean).join(" · ")}
                </p>
              ) : null}
              {item.credential_url ? (
                <a
                  className="text-link"
                  href={item.credential_url}
                  rel="noopener noreferrer"
                >
                  View credential ↗
                </a>
              ) : null}
            </article>
          ))}
        </div>
      );
      break;
    case "achievements":
      content = (
        <div className="achievement-list">
          {portfolio.achievements.map((item) => (
            <article key={`${item.name}-${item.context}`}>
              <p className="eyebrow small">{item.context}</p>
              <h3>{item.name}</h3>
              <p className="achievement-result">{item.result}</p>
              {item.description ? (
                <p className="prose">{item.description}</p>
              ) : null}
              {item.url ? (
                <a
                  className="text-link"
                  href={item.url}
                  rel="noopener noreferrer"
                >
                  View source ↗
                </a>
              ) : null}
            </article>
          ))}
        </div>
      );
      break;
    case "interests":
      content = (
        <ul className="interest-list">
          {portfolio.interests.map((item) => (
            <li key={item.name}>{item.name}</li>
          ))}
        </ul>
      );
      break;
    case "links":
      content = (
        <div className="link-row">
          {portfolio.navigation
            .filter((item) => item.kind !== "navigation")
            .map((item) => (
              <a
                className="button secondary"
                key={item.url}
                href={item.url}
                rel="noopener noreferrer"
              >
                {item.label} <span aria-hidden="true">↗</span>
              </a>
            ))}
        </div>
      );
      break;
    case "contact":
      content = (
        <>
          <div className="link-row">
            {portfolio.socialLinks.map((item) => (
              <a
                className="text-link social-link"
                key={item.url}
                href={item.url}
                rel="noopener noreferrer"
              >
                <SocialIcon icon={item.icon} /> {item.label} ↗
              </a>
            ))}
          </div>
          {portfolio.profile?.contact_form_enabled && contactAvailable() ? (
            <ContactForm />
          ) : null}
          <dl className="facts">
            {portfolio.facts
              .filter((f) => f.kind !== "text")
              .map((fact) => (
                <div key={`${fact.label}-${fact.value}`}>
                  <dt>{fact.label}</dt>
                  <dd>{fact.value}</dd>
                </div>
              ))}
          </dl>
          {!portfolio.socialLinks.length &&
          !portfolio.facts.some((f) => f.kind !== "text") ? (
            <p>Contact options have not been published yet.</p>
          ) : null}
        </>
      );
      break;
  }
  const counts: Record<PublicSection["key"], number> = {
    about: portfolio.profile?.biography ? 1 : 0,
    projects: portfolio.projects.length,
    experience: portfolio.experiences.length,
    skills: portfolio.skillGroups.length,
    education: portfolio.education.length,
    certifications: portfolio.certifications.length,
    achievements: portfolio.achievements.length,
    interests: portfolio.interests.length,
    links: portfolio.navigation.filter((item) => item.kind !== "navigation")
      .length,
    contact:
      portfolio.socialLinks.length +
      portfolio.facts.filter((fact) => fact.kind !== "text").length +
      (portfolio.profile?.contact_form_enabled && contactAvailable() ? 1 : 0),
  };
  if (!counts[section.key])
    content = (
      <p className="muted">
        No entries have been published in this section yet.
      </p>
    );
  return (
    <section id={section.key} className="section">
      <div className="section-heading">
        <p className="eyebrow">
          {String(index + 2).padStart(2, "0")} / {section.title}
        </p>
        <h2>{section.title}</h2>
        {section.subtitle ? <p className="lede">{section.subtitle}</p> : null}
      </div>
      {content}
    </section>
  );
}
