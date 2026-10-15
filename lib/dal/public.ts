import { galleryImages } from "./gallery";
import "server-only";
import { cache } from "react";
import { createPublicClient } from "@/lib/supabase/server";
import { getSupabaseConfig, isDevelopmentDemo } from "@/lib/supabase/config";
import { getDevelopmentPreview, getDevelopmentProject } from "./demo";
import {
  publicSkillSchema,
  publicProfileSchema,
  publicSectionSchema,
  publicProjectSchema,
  publicProjectCardSchema,
  publicExperienceSchema,
  publicEducationSchema,
  publicCertificationSchema,
  publicAchievementSchema,
  publicSocialSchema,
  publicNavigationSchema,
  publicInterestSchema,
  publicFactSchema,
  type PublicPortfolio,
} from "@/lib/validations/public-content";
import type { PostgrestError } from "@supabase/supabase-js";

function rows<T>(
  result: { data: T[] | null; error: PostgrestError | null },
  group: string,
): T[] {
  if (result.error) {
    console.error("Portfolio read failed", { group, code: result.error.code });
    throw new Error("Portfolio content is temporarily unavailable.");
  }
  return result.data ?? [];
}
const empty: PublicPortfolio = {
  profile: null,
  sections: [],
  projects: [],
  experiences: [],
  education: [],
  certifications: [],
  achievements: [],
  skillGroups: [],
  interests: [],
  socialLinks: [],
  navigation: [],
  facts: [],
  demo: false,
};
export const getPortfolioProfile = cache(async (): Promise<PublicPortfolio> => {
  if (isDevelopmentDemo()) return getDevelopmentPreview();
  if (!getSupabaseConfig()) return empty;
  const db = createPublicClient();
  const [
    profile,
    sections,
    projects,
    experiences,
    education,
    certifications,
    achievements,
    groups,
    skills,
    interests,
    social,
    navigation,
    facts,
  ] = await Promise.all([
    db
      .from("site_settings")
      .select(
        "status,name,headline,summary,biography,profile_image,favicon_image,social_preview_image,hero_visual_caption,last_updated_label,show_last_updated,primary_cta_label,primary_cta_href,secondary_cta_label,secondary_cta_href,footer_text,seo_title,seo_description,contact_form_enabled,orbit_enabled",
      )
      .eq("status", "published"),
    db
      .from("section_settings")
      .select("status,key,title,subtitle,visible,sort_order")
      .eq("status", "published")
      .eq("visible", true)
      .order("sort_order")
      .order("id"),
    db
      .from("projects")
      .select(
        "status,title,slug,summary,category,technologies,cover_image,cover_alt,featured",
      )
      .eq("status", "published")
      .order("sort_order")
      .order("id"),
    db
      .from("experiences")
      .select("status,organization,role,date_label,location,bullets,url")
      .eq("status", "published")
      .order("sort_order")
      .order("id"),
    db
      .from("education")
      .select(
        "status,institution,qualification,date_label,description,image,url",
      )
      .eq("status", "published")
      .order("sort_order")
      .order("id"),
    db
      .from("certifications")
      .select("status,name,issuer,date_label,image,credential_url")
      .eq("status", "published")
      .order("sort_order")
      .order("id"),
    db
      .from("achievements")
      .select("status,name,context,result,description,url")
      .eq("status", "published")
      .order("sort_order")
      .order("id"),
    db
      .from("skill_groups")
      .select("id,name")
      .eq("status", "published")
      .order("sort_order")
      .order("id"),
    db
      .from("skills")
      .select("group_id,name,description")
      .eq("status", "published")
      .order("sort_order")
      .order("id"),
    db
      .from("interests")
      .select("status,name")
      .eq("status", "published")
      .order("sort_order")
      .order("id"),
    db
      .from("social_links")
      .select("status,label,icon,url")
      .eq("status", "published")
      .order("sort_order")
      .order("id"),
    db
      .from("navigation_items")
      .select("status,label,url,kind")
      .eq("status", "published")
      .order("sort_order")
      .order("id"),
    db
      .from("profile_facts")
      .select("is_public,label,value,kind")
      .eq("is_public", true)
      .order("sort_order")
      .order("id"),
  ]);
  const publicSkills = rows(skills, "skills");
  const profiles = rows(profile, "settings");
  return {
    profile: profiles.length ? publicProfileSchema.parse(profiles[0]) : null,
    sections: rows(sections, "sections").map((row) =>
      publicSectionSchema.parse(row),
    ),
    projects: rows(projects, "projects").map((row) =>
      publicProjectCardSchema.parse(row),
    ),
    experiences: rows(experiences, "experience").map((row) =>
      publicExperienceSchema.parse(row),
    ),
    education: rows(education, "education").map((row) =>
      publicEducationSchema.parse(row),
    ),
    certifications: rows(certifications, "certifications").map((row) =>
      publicCertificationSchema.parse(row),
    ),
    achievements: rows(achievements, "achievements").map((row) =>
      publicAchievementSchema.parse(row),
    ),
    skillGroups: rows(groups, "skill groups").map((group) => ({
      name: group.name,
      skills: publicSkills
        .filter((skill) => skill.group_id === group.id)
        .map((skill) => publicSkillSchema.parse(skill)),
    })),
    interests: rows(interests, "interests").map((row) =>
      publicInterestSchema.parse(row),
    ),
    socialLinks: rows(social, "social links").map((row) =>
      publicSocialSchema.parse(row),
    ),
    navigation: rows(navigation, "navigation").map((row) =>
      publicNavigationSchema.parse(row),
    ),
    facts: rows(facts, "facts").map((row) => publicFactSchema.parse(row)),
    demo: false,
  };
});
export async function getPublishedProjects() {
  return getProjectIndex();
}
export const getPublishedProject = cache(async (slug: string) => {
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug) || slug.length > 180) return null;
  if (isDevelopmentDemo()) return getDevelopmentProject(slug);
  if (!getSupabaseConfig()) return null;
  const { data, error } = await createPublicClient()
    .from("projects")
    .select(
      "status,title,slug,summary,details,category,technologies,cover_image,cover_alt,repository_url,demo_url,download_url,featured,seo_title,seo_description",
    )
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  if (error) throw new Error("Project content is temporarily unavailable.");
  return data ? publicProjectSchema.parse(data) : null;
});

export async function getPublishedProjectGallery(slug: string) {
  if (isDevelopmentDemo() || !getSupabaseConfig()) return [];
  const db = createPublicClient();
  const { data: project, error } = await db
    .from("projects")
    .select("id")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  if (error) throw new Error("Project images are temporarily unavailable.");
  if (!project) return [];
  const gallery = await db
    .from("project_media")
    .select("media_id,caption")
    .eq("project_id", project.id)
    .order("sort_order")
    .order("id");
  const galleryRows = rows(gallery, "gallery");
  if (!galleryRows.length) return [];
  const media = await db
    .from("media_assets")
    .select("id,bucket,object_path,alt_text,mime_type,width,height")
    .eq("is_public", true)
    .eq("bucket", "portfolio-public")
    .in(
      "id",
      galleryRows.map((row) => row.media_id),
    );
  return galleryImages(galleryRows, rows(media, "gallery media"));
}

export const getPublicIdentity = cache(async () => {
  if (isDevelopmentDemo()) return getDevelopmentPreview().profile;
  if (!getSupabaseConfig()) return null;
  const result = await createPublicClient()
    .from("site_settings")
    .select(
      "status,name,headline,summary,biography,profile_image,favicon_image,social_preview_image,hero_visual_caption,last_updated_label,show_last_updated,primary_cta_label,primary_cta_href,secondary_cta_label,secondary_cta_href,footer_text,seo_title,seo_description,contact_form_enabled,orbit_enabled",
    )
    .eq("status", "published");
  const profiles = rows(result, "settings");
  return profiles.length ? publicProfileSchema.parse(profiles[0]) : null;
});
export const getPortfolioShell = cache(
  async (): Promise<
    Pick<PublicPortfolio, "profile" | "sections" | "navigation" | "demo">
  > => {
    if (isDevelopmentDemo()) {
      const { profile, sections, navigation, demo } = getDevelopmentPreview();
      return { profile, sections, navigation, demo };
    }
    if (!getSupabaseConfig())
      return { profile: null, sections: [], navigation: [], demo: false };
    const db = createPublicClient();
    const [profile, sections, navigation] = await Promise.all([
      getPublicIdentity(),
      db
        .from("section_settings")
        .select("status,key,title,subtitle,visible,sort_order")
        .eq("status", "published")
        .eq("visible", true)
        .order("sort_order")
        .order("id"),
      db
        .from("navigation_items")
        .select("status,label,url,kind")
        .eq("status", "published")
        .order("sort_order")
        .order("id"),
    ]);
    return {
      profile,
      sections: rows(sections, "sections").map((row) =>
        publicSectionSchema.parse(row),
      ),
      navigation: rows(navigation, "navigation").map((row) =>
        publicNavigationSchema.parse(row),
      ),
      demo: false,
    };
  },
);
export async function getProjectIndex() {
  if (isDevelopmentDemo()) return getDevelopmentPreview().projects;
  if (!getSupabaseConfig()) return [];
  const result = await createPublicClient()
    .from("projects")
    .select(
      "status,title,slug,summary,category,technologies,cover_image,cover_alt,featured",
    )
    .eq("status", "published")
    .order("sort_order")
    .order("id");
  return rows(result, "projects").map((row) =>
    publicProjectCardSchema.parse(row),
  );
}

export const getProjectArchiveText = cache(async () => {
  if (isDevelopmentDemo()) {
    const row = getDevelopmentPreview().sections.find(
      (section) => section.key === "projects",
    );
    return { title: row?.title || "Projects", subtitle: row?.subtitle || "" };
  }
  if (!getSupabaseConfig()) return { title: "Projects", subtitle: "" };
  const { data, error } = await createPublicClient()
    .from("section_settings")
    .select("title,subtitle")
    .eq("key", "projects")
    .eq("status", "published")
    .maybeSingle();
  if (error) throw new Error("Project archive is temporarily unavailable.");
  return data ?? { title: "Projects", subtitle: "" };
});

export const getProjectRedirect = cache(async (slug: string) => {
  if (
    !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug) ||
    slug.length > 180 ||
    isDevelopmentDemo() ||
    !getSupabaseConfig()
  )
    return null;
  const db = createPublicClient();
  const { data: alias, error } = await db
    .from("project_slug_aliases")
    .select("project_id")
    .eq("old_slug", slug)
    .maybeSingle();
  if (error) throw new Error("Project route is temporarily unavailable.");
  if (!alias) return null;
  const { data: project, error: projectError } = await db
    .from("projects")
    .select("slug")
    .eq("id", alias.project_id)
    .eq("status", "published")
    .maybeSingle();
  if (projectError)
    throw new Error("Project route is temporarily unavailable.");
  return project && project.slug !== slug ? `/projects/${project.slug}` : null;
});
