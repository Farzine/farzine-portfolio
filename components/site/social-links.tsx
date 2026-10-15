import type { Portfolio } from "@/lib/content/public-model";

const icons: Record<string, string> = {
  linkedin: "bxl-linkedin",
  github: "bxl-github",
  email: "bx-envelope",
  facebook: "bxl-facebook",
};
export function SocialLinks({ links }: { links: Portfolio["socials"] }) {
  if (!links.length) return null;
  return (
    <nav className="social-links" aria-label="Social links">
      {links.map((link) => (
        <a
          key={link.id}
          href={link.url}
          target={link.url.startsWith("mailto:") ? undefined : "_blank"}
          rel="noopener noreferrer"
        >
          <i
            className={`bx ${icons[link.icon] || "bx-link-external"}`}
            aria-hidden="true"
          />
          <span className="sr-only">{link.label}</span>
        </a>
      ))}
    </nav>
  );
}
