import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { SiteShell } from "@/components/site/shell";
import { ProfileSection } from "@/components/site/profile-sections";
import { getPortfolioProfile } from "@/lib/dal/public";
export const dynamic = "force-dynamic";
export async function generateMetadata(): Promise<Metadata> {
  const { profile } = await getPortfolioProfile();
  return profile
    ? {
        title: profile.seo_title || profile.name,
        description: profile.seo_description || profile.summary,
      }
    : {
        title: "Portfolio",
        description: "Portfolio content awaiting publication.",
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
  return (
    <SiteShell portfolio={portfolio}>
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
              <a href={item.url} rel="noopener noreferrer" key={item.url}>
                {item.label} ↗
              </a>
            ))}
          </div>
        </div>
        {profile.profile_image ? (
          <div className="profile-art">
            <div className="orbit" aria-hidden="true" />
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
