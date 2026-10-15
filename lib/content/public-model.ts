import type { Database } from "@/lib/types/database";

type Tables = Database["public"]["Tables"];
type Item<Name extends keyof Tables> = Tables[Name]["Insert"] & { id: string };
export type PublicRecords = {
  settings: Tables["site_settings"]["Insert"] | null;
  sections: Tables["section_settings"]["Insert"][];
  projects: Item<"projects">[];
  media: Item<"media_assets">[];
  gallery: Item<"project_media">[];
  facts: Item<"profile_facts">[];
  experience: Item<"experiences">[];
  education: Item<"education">[];
  certifications: Item<"certifications">[];
  achievements: Item<"achievements">[];
  skillGroups: Item<"skill_groups">[];
  skills: Item<"skills">[];
  interests: Item<"interests">[];
  socials: Item<"social_links">[];
  documents: Item<"document_links">[];
  navigation: Item<"navigation_items">[];
};

export function safeLink(
  value: string | null | undefined,
  mailto = false,
): string | null {
  if (
    !value ||
    value.length > 2048 ||
    /\s/.test(value) ||
    [...value].some(
      (character) =>
        character.charCodeAt(0) < 32 || character.charCodeAt(0) === 127,
    )
  )
    return null;
  try {
    const url = new URL(value);
    if (url.username || url.password) return null;
    if (["https:", "http:"].includes(url.protocol)) return value;
    if (
      mailto &&
      !/%(?:0[0-9a-f]|1[0-9a-f]|7f)/i.test(value) &&
      /^mailto:[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(value)
    )
      return value;
  } catch {
    /* Invalid stored links render as text instead of an unsafe action. */
  }
  return null;
}

export function isPublished(
  project: { status?: string; published_at?: string | null },
  now = Date.now(),
): boolean {
  return (
    project.status === "published" &&
    !!project.published_at &&
    Date.parse(project.published_at) <= now
  );
}

function ordered<T extends { sort_order?: number }>(rows: T[]): T[] {
  return [...rows].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
}
function visible<T extends { is_visible?: boolean; sort_order?: number }>(
  rows: T[],
): T[] {
  return ordered(rows.filter((row) => row.is_visible === true));
}

export type PublicMedia = {
  src: string;
  alt: string;
  width: number;
  height: number;
  kind: string;
};
function publicMedia(
  row: Item<"media_assets">,
  storageOrigin: string | null,
): PublicMedia | null {
  if (!row.is_public) return null;
  let src: string | null = null;
  if (
    row.legacy_path &&
    /^\/assets\/img\/(?:[A-Za-z0-9_ -]+\/)*[A-Za-z0-9_ -]+\.(png|jpg|jpeg|webp|avif)$/.test(
      row.legacy_path,
    )
  )
    src = row.legacy_path;
  if (
    row.bucket === "portfolio-public" &&
    row.object_path &&
    /^[a-f0-9-]{36}\/[a-f0-9-]{36}\.(png|jpg|jpeg|webp|avif|pdf)$/.test(
      row.object_path,
    ) &&
    storageOrigin
  ) {
    src = `${storageOrigin.replace(/\/$/, "")}/storage/v1/object/public/portfolio-public/${row.object_path}`;
  }
  return src
    ? {
        src,
        alt: row.alt_text || row.label,
        width: row.width || 640,
        height: row.height || 480,
        kind: row.kind,
      }
    : null;
}

// Explicit DTO construction is shared by real DB reads and the read-only development preview.
export function toPublicPortfolio(
  records: PublicRecords,
  storageOrigin: string | null,
  now = Date.now(),
) {
  if (!records.settings) throw new Error("Portfolio settings are unavailable.");
  const settings = records.settings;
  const media = new Map(
    records.media.map((row) => [row.id, publicMedia(row, storageOrigin)]),
  );
  const image = (id?: string | null) => (id ? media.get(id) || null : null);
  const sections = visible(records.sections).map((row) => ({
    key: row.key,
    title: row.title,
    parentKey: row.parent_key || null,
    allLabel: row.filter_all_label || "All",
  }));
  const sectionKeys = new Set(sections.map((section) => section.key));
  const publicProjects = ordered(
    records.projects.filter((row) => isPublished(row, now)),
  );
  const projects = publicProjects.map((row) => ({
    id: row.id,
    title: row.title,
    detailTitle: row.detail_title || row.title,
    slug: row.slug,
    summary: row.summary || "",
    paragraphs: row.paragraphs || [],
    technologies: row.technologies || [],
    category: row.category || "",
    cover: image(row.cover_media_id),
    sourceUrl: safeLink(row.source_url),
    demoUrl: safeLink(row.demo_url),
    downloadUrl: safeLink(row.download_url),
    featured: row.featured === true,
    seoTitle: row.seo_title || "",
    seoDescription: row.seo_description || "",
    gallery: ordered(
      records.gallery.filter((item) => item.project_id === row.id),
    ).flatMap((item) => {
      const asset = image(item.media_id);
      return asset ? [{ image: asset, caption: item.caption || "" }] : [];
    }),
  }));
  return {
    settings: {
      name: settings.display_name,
      fullName: settings.full_name,
      rolePrefix: settings.role_prefix || "",
      roles: settings.roles || [],
      biography: settings.biography || "",
      portrait: image(settings.profile_media_id),
      seoImage: image(settings.seo_image_media_id),
      icon: image(settings.icon_media_id),
      updatedLabel: settings.updated_label || "",
      updatedDisplay: settings.updated_display || "",
      footer: settings.footer_text || "",
      socialHeading: settings.social_heading || "",
      seoTitle: settings.seo_title || settings.full_name,
      seoDescription: settings.seo_description || "",
      canonicalUrl: safeLink(settings.canonical_url),
      twitterHandle: settings.twitter_handle || "",
      primaryCta: {
        label: settings.primary_cta_label || "",
        href: safeLink(settings.primary_cta_url, true),
      },
      secondaryCta: {
        label: settings.secondary_cta_label || "",
        href: safeLink(settings.secondary_cta_url, true),
      },
    },
    sections,
    navigation: visible(records.navigation)
      .filter((row) => sectionKeys.has(row.section_key))
      .map((row) => ({ label: row.label, sectionKey: row.section_key })),
    projects,
    facts: visible(records.facts).map((row) => ({
      id: row.id,
      label: row.label,
      value: row.value,
      placement: row.placement,
      icon: row.icon || "info",
    })),
    experience: visible(records.experience).map((row) => ({
      id: row.id,
      organization: row.organization,
      role: row.role,
      date: row.date_label || "",
      bullets: row.bullets || [],
      url: safeLink(row.url),
    })),
    education: visible(records.education).map((row) => ({
      id: row.id,
      institution: row.institution || "",
      qualification: row.qualification,
      date: row.date_label || "",
      description: row.description || "",
      url: safeLink(row.url),
      image: image(row.media_id),
    })),
    certifications: visible(records.certifications).map((row) => ({
      id: row.id,
      name: row.name,
      issuer: row.issuer || "",
      date: row.date_label || "",
      url: safeLink(row.credential_url),
      image: image(row.media_id),
    })),
    achievements: visible(records.achievements).map((row) => ({
      id: row.id,
      title: row.title,
      result: row.result || "",
      date: row.date_label || "",
      bullets: row.bullets || [],
      url: safeLink(row.url),
    })),
    skillGroups: visible(records.skillGroups).map((row) => ({
      id: row.id,
      name: row.name,
      skills: visible(records.skills)
        .filter((skill) => skill.group_id === row.id)
        .map((skill) => ({
          id: skill.id,
          name: skill.name,
          description: skill.description || "",
          logoUrl: safeLink(skill.logo_url),
        })),
    })),
    interests: visible(records.interests).map((row) => ({
      id: row.id,
      name: row.name,
      icon: row.icon,
      color: /^#[a-f0-9]{6}$/i.test(row.color) ? row.color : "#21e5f3",
    })),
    socials: visible(records.socials).flatMap((row) => {
      const url = safeLink(row.url, true);
      return url
        ? [
            {
              id: row.id,
              label: row.label,
              url,
              icon: row.icon,
              placement: row.placement,
            },
          ]
        : [];
    }),
    documents: visible(records.documents).flatMap((row) => {
      const url = safeLink(row.url) || image(row.media_id)?.src;
      return url
        ? [
            {
              id: row.id,
              title: row.title,
              description: row.description || "",
              url,
            },
          ]
        : [];
    }),
  };
}
export type Portfolio = ReturnType<typeof toPublicPortfolio>;
export type PublicProject = Portfolio["projects"][number];
