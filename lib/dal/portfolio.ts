import "server-only";
import { cache } from "react";
import { toPublicPortfolio } from "@/lib/content/public-model";
import {
  readSupabaseConfig,
  isDevelopmentSeedEnabled,
} from "@/lib/security/runtime-config";
import { createPublicClient } from "@/lib/supabase/public";

function dataOrThrow<T>(
  result: { data: T; error: { code?: string } | null },
  group: string,
): NonNullable<T> {
  if (result.error || result.data === null || result.data === undefined) {
    console.error("Public portfolio read failed", {
      group,
      code: result.error?.code || "missing",
    });
    throw new Error("Portfolio content is temporarily unavailable.");
  }
  return result.data;
}

// React cache deduplicates reads within one server render; shared caching is phase 7.
export const getPortfolio = cache(async () => {
  if (isDevelopmentSeedEnabled()) {
    const { getDevelopmentRecords } = await import("./development-seed");
    return {
      ...toPublicPortfolio(await getDevelopmentRecords(), null),
      developmentPreview: true,
    };
  }
  const client = createPublicClient();
  const [
    labels,
    settings,
    sections,
    projects,
    media,
    gallery,
    facts,
    experience,
    education,
    certifications,
    achievements,
    skillGroups,
    skills,
    interests,
    socials,
    documents,
    navigation,
  ] = await Promise.all([
    client.from("public_labels").select("key,value").order("key"),
    client
      .from("site_settings")
      .select(
        "display_name,full_name,role_prefix,roles,biography,profile_media_id,seo_image_media_id,icon_media_id,twitter_handle,social_heading,updated_label,updated_display,footer_text,seo_title,seo_description,canonical_url,primary_cta_label,primary_cta_url,secondary_cta_label,secondary_cta_url",
      )
      .eq("id", true)
      .single(),
    client
      .from("section_settings")
      .select("key,title,parent_key,filter_all_label,sort_order,is_visible")
      .eq("is_visible", true)
      .order("sort_order")
      .order("key"),
    client
      .from("projects")
      .select(
        "id,title,detail_title,slug,summary,paragraphs,technologies,category,cover_media_id,source_url,demo_url,download_url,status,published_at,featured,sort_order,seo_title,seo_description",
      )
      .eq("status", "published")
      .lte("published_at", new Date().toISOString())
      .order("sort_order")
      .order("id"),
    client
      .from("media_assets")
      .select(
        "id,label,alt_text,kind,bucket,object_path,legacy_path,mime_type,size_bytes,width,height,is_public",
      )
      .eq("is_public", true),
    client
      .from("project_media")
      .select("id,project_id,media_id,caption,sort_order")
      .order("sort_order")
      .order("id"),
    client
      .from("profile_facts")
      .select("id,label,value,placement,icon,sort_order,is_visible")
      .eq("is_visible", true)
      .order("sort_order")
      .order("id"),
    client
      .from("experiences")
      .select(
        "id,organization,role,date_label,bullets,url,sort_order,is_visible",
      )
      .eq("is_visible", true)
      .order("sort_order")
      .order("id"),
    client
      .from("education")
      .select(
        "id,institution,qualification,date_label,description,url,media_id,sort_order,is_visible",
      )
      .eq("is_visible", true)
      .order("sort_order")
      .order("id"),
    client
      .from("certifications")
      .select(
        "id,name,issuer,date_label,credential_url,media_id,sort_order,is_visible",
      )
      .eq("is_visible", true)
      .order("sort_order")
      .order("id"),
    client
      .from("achievements")
      .select("id,title,result,date_label,bullets,url,sort_order,is_visible")
      .eq("is_visible", true)
      .order("sort_order")
      .order("id"),
    client
      .from("skill_groups")
      .select("id,name,sort_order,is_visible")
      .eq("is_visible", true)
      .order("sort_order")
      .order("id"),
    client
      .from("skills")
      .select("id,group_id,name,description,logo_url,sort_order,is_visible")
      .eq("is_visible", true)
      .order("sort_order")
      .order("id"),
    client
      .from("interests")
      .select("id,name,icon,color,sort_order,is_visible")
      .eq("is_visible", true)
      .order("sort_order")
      .order("id"),
    client
      .from("social_links")
      .select("id,label,url,icon,placement,sort_order,is_visible")
      .eq("is_visible", true)
      .order("sort_order")
      .order("id"),
    client
      .from("document_links")
      .select("id,title,description,url,media_id,sort_order,is_visible")
      .eq("is_visible", true)
      .order("sort_order")
      .order("id"),
    client
      .from("navigation_items")
      .select("id,label,section_key,sort_order,is_visible")
      .eq("is_visible", true)
      .order("sort_order")
      .order("id"),
  ]);
  return {
    ...toPublicPortfolio(
      {
        labels: dataOrThrow(labels, "labels"),
        settings: dataOrThrow(settings, "settings"),
        sections: dataOrThrow(sections, "sections"),
        projects: dataOrThrow(projects, "projects"),
        media: dataOrThrow(media, "media"),
        gallery: dataOrThrow(gallery, "gallery"),
        facts: dataOrThrow(facts, "facts"),
        experience: dataOrThrow(experience, "experience"),
        education: dataOrThrow(education, "education"),
        certifications: dataOrThrow(certifications, "certifications"),
        achievements: dataOrThrow(achievements, "achievements"),
        skillGroups: dataOrThrow(skillGroups, "skillGroups"),
        skills: dataOrThrow(skills, "skills"),
        interests: dataOrThrow(interests, "interests"),
        socials: dataOrThrow(socials, "socials"),
        documents: dataOrThrow(documents, "documents"),
        navigation: dataOrThrow(navigation, "navigation"),
      },
      readSupabaseConfig().url,
    ),
    developmentPreview: false,
  };
});

export async function getPublishedProject(slug: string) {
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug) || slug.length > 100) return null;
  return (
    (await getPortfolio()).projects.find((project) => project.slug === slug) ||
    null
  );
}
