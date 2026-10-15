import { SocialIcon } from "@/components/ui/social-icon";
import { StructuredData } from "@/components/site/structured-data";
import { headers } from "next/headers";
import { publicPageMetadata, siteOrigin } from "@/lib/security/metadata";
import { ProfileOrbit } from "@/components/three/profile-orbit";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { SiteShell } from "@/components/site/shell";
import { ProfileSection } from "@/components/site/profile-sections";
import { getPortfolioProfile } from "@/lib/dal/public";
export async function generateMetadata(): Promise<Metadata> {
  const { profile } = await getPortfolioProfile();
  const metadata = publicPageMetadata(
    profile,
    "/",
    profile?.seo_title || profile?.name || "Portfolio",
    profile?.seo_description ||
      profile?.summary ||
      "Portfolio content awaiting publication.",
  );
  return {
    ...metadata,
    title: {
      absolute:
        profile?.seo_title ||
        (profile ? `${profile.name} — Portfolio` : "Portfolio"),
    },
  };
}
export default async function Home() {
  const portfolio = await getPortfolioProfile();
  const profile = portfolio.profile;
  if (!profile)
    return (
      <SiteShell portfolio={portfolio}>
        <section className="section">
          <p className="eyebrow">Profile explorer</p>
          <h1>
            A profile,
            <br />
            <em>in the making.</em>
          </h1>
          <p className="lede">
            Portfolio content has not been published yet. Please check back
            soon.
          </p>
        </section>
      </SiteShell>
    );
  const [first, ...rest] = profile.name.split(" ");
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  const origin = siteOrigin();
  return (
    <SiteShell portfolio={portfolio}>
      {origin ? (
        <StructuredData
          nonce={nonce}
          data={{
            "@context": "https://schema.org",
            "@type": "Person",
            name: profile.name,
            url: origin,
            description: profile.summary,
            ...(profile.profile_image
              ? { image: new URL(profile.profile_image, origin).href }
              : {}),
            sameAs: portfolio.socialLinks.map((link) => link.url),
          }}
        />
      ) : null}
      <section className="hero" aria-labelledby="intro-title">
        <div>
          <p className="eyebrow">01 / Profile</p>
          <h1 id="intro-title">
            {first}
            {rest.length ? (
              <>
                <br />
                <em>{rest.join(" ")}.</em>
              </>
            ) : null}
          </h1>
          <p className="hero-role">{profile.headline}</p>
          <p className="lede">{profile.summary}</p>
          <div className="link-row">
            {profile.primary_cta_label ? (
              <Link className="button" href={profile.primary_cta_href}>
                {profile.primary_cta_label}
                <span aria-hidden="true">↘</span>
              </Link>
            ) : null}
            {profile.secondary_cta_label ? (
              <Link
                className="button secondary"
                href={profile.secondary_cta_href}
              >
                {profile.secondary_cta_label}
              </Link>
            ) : null}
          </div>
          {profile.show_last_updated && profile.last_updated_label ? (
            <p className="muted small">
              Last updated: {profile.last_updated_label}
            </p>
          ) : null}
          <div className="link-row hero-social">
            {portfolio.socialLinks.map((item) => (
              <a
                className="social-link"
                href={item.url}
                rel="noopener noreferrer"
                key={item.url}
              >
                <SocialIcon icon={item.icon} /> {item.label} ↗
              </a>
            ))}
          </div>
        </div>
        {profile.profile_image ? (
          <div className="profile-art">
            {profile.orbit_enabled ? (
              <ProfileOrbit />
            ) : (
              <div className="orbit" aria-hidden="true" />
            )}
            <Image
              src={profile.profile_image}
              alt={profile.name}
              width={563}
              height={583}
              sizes="(max-width: 639px) 85vw, 40vw"
              preload
            />
            {profile.hero_visual_caption ? (
              <p className="art-label">{profile.hero_visual_caption}</p>
            ) : null}
          </div>
        ) : null}
      </section>
      {portfolio.sections.map((section, index) => (
        <ProfileSection
          key={section.key}
          section={section}
          portfolio={portfolio}
          index={index}
        />
      ))}
    </SiteShell>
  );
}
