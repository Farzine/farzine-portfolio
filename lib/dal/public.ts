import "server-only";
import { cache } from "react";
import { createPublicClient } from "@/lib/supabase/server";
import { getSupabaseConfig, isDevelopmentDemo } from "@/lib/supabase/config";
import { getDevelopmentPreview } from "./demo";
import {
  publicProfileSchema,
  publicSectionSchema,
  publicProjectSchema,
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
        "status,name,headline,summary,biography,profile_image,hero_visual_caption,last_updated_label,show_last_updated,primary_cta_label,primary_cta_href,secondary_cta_label,secondary_cta_href,footer_text,seo_title,seo_description,contact_form_enabled",
      )
      .eq("status", "published"),
    db
      .from("section_settings")
      .select("status,key,title,subtitle,visible,sort_order")
      .eq("status", "published")
      .eq("visible", true)
      .order("sort_order"),
    db
      .from("projects")
      .select(
        "status,title,slug,summary,details,category,technologies,cover_image,cover_alt,repository_url,demo_url,download_url,featured,seo_title,seo_description",
      )
      .eq("status", "published")
      .order("sort_order"),
    db
      .from("experiences")
      .select("status,organization,role,date_label,location,bullets,url")
      .eq("status", "published")
      .order("sort_order"),
    db
      .from("education")
      .select(
        "status,institution,qualification,date_label,description,image,url",
      )
      .eq("status", "published")
      .order("sort_order"),
    db
      .from("certifications")
      .select("status,name,issuer,date_label,image,credential_url")
      .eq("status", "published")
      .order("sort_order"),
    db
      .from("achievements")
      .select("status,name,context,result,description,url")
      .eq("status", "published")
      .order("sort_order"),
    db
      .from("skill_groups")
      .select("id,name")
      .eq("status", "published")
      .order("sort_order"),
    db
      .from("skills")
      .select("group_id,name")
      .eq("status", "published")
      .order("sort_order"),
    db
      .from("interests")
      .select("status,name")
      .eq("status", "published")
      .order("sort_order"),
    db
      .from("social_links")
      .select("status,label,icon,url")
      .eq("status", "published")
      .order("sort_order"),
    db
      .from("navigation_items")
      .select("status,label,url,kind")
      .eq("status", "published")
      .order("sort_order"),
    db
      .from("profile_facts")
      .select("is_public,label,value,kind")
      .eq("is_public", true)
      .order("sort_order"),
  ]);
  const publicSkills = rows(skills, "skills");
  const profiles = rows(profile, "settings");
  return {
    profile: profiles.length ? publicProfileSchema.parse(profiles[0]) : null,
    sections: rows(sections, "sections").map((row) =>
      publicSectionSchema.parse(row),
    ),
    projects: rows(projects, "projects").map((row) =>
      publicProjectSchema.parse(row),
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
        .map((skill) => skill.name),
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
  return (await getPortfolioProfile()).projects;
}
export async function getPublishedProject(slug: string) {
  return (
    (await getPublishedProjects()).find((project) => project.slug === slug) ??
    null
  );
}
