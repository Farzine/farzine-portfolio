import "server-only";
import { cache } from "react";
import { unstable_cache } from "next/cache";
import { createHash } from "node:crypto";
import { publicTag, type PublicGroup } from "@/lib/cache/public-groups";
import { toPublicPortfolio, safeLink } from "@/lib/content/public-model";
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

function publicRead<T>(
  group: PublicGroup,
  read: () => PromiseLike<{ data: T; error: { code?: string } | null }>,
) {
  const config = readSupabaseConfig();
  const credential = createHash("sha256").update(config.key).digest("hex");
  return unstable_cache(
    async () => dataOrThrow(await read(), group),
    ["portfolio-public-v1", group, config.url, credential, read.toString()],
    { tags: [publicTag(group)], revalidate: 60 },
  )();
}

// Anonymous projections alone enter shared cache; DTO mapping stays request-local.
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
    publicRead("labels", () =>
      client.from("public_labels").select("key,value").order("key"),
    ),
    publicRead("settings", () =>
      client
        .from("site_settings")
        .select(
          "display_name,full_name,role_prefix,roles,biography,profile_media_id,seo_image_media_id,icon_media_id,twitter_handle,social_heading,updated_label,updated_display,footer_text,seo_title,seo_description,canonical_url,primary_cta_label,primary_cta_url,secondary_cta_label,secondary_cta_url",
        )
        .eq("id", true)
        .single(),
    ),
    publicRead("sections", () =>
      client
        .from("section_settings")
        .select("key,title,parent_key,filter_all_label,sort_order,is_visible")
        .eq("is_visible", true)
        .order("sort_order")
        .order("key"),
    ),
    publicRead("projects", () =>
      client
        .from("projects")
        .select(
          "id,title,detail_title,slug,summary,paragraphs,technologies,category,cover_media_id,source_url,demo_url,download_url,status,published_at,featured,sort_order,seo_title,seo_description",
        )
        .eq("status", "published")
        .lte("published_at", new Date().toISOString())
        .order("sort_order")
        .order("id"),
    ),
    publicRead("media", () =>
      client
        .from("media_assets")
        .select(
          "id,label,alt_text,kind,bucket,object_path,legacy_path,mime_type,size_bytes,width,height,is_public",
        )
        .eq("is_public", true)
        .eq("pending_delete", false),
    ),
    publicRead("gallery", () =>
      client
        .from("project_media")
        .select("id,project_id,media_id,caption,sort_order")
        .order("sort_order")
        .order("id"),
    ),
    publicRead("facts", () =>
      client
        .from("profile_facts")
        .select("id,label,value,placement,icon,sort_order,is_visible")
        .eq("is_visible", true)
        .order("sort_order")
        .order("id"),
    ),
    publicRead("experience", () =>
      client
        .from("experiences")
        .select(
          "id,organization,role,date_label,bullets,url,sort_order,is_visible",
        )
        .eq("is_visible", true)
        .order("sort_order")
        .order("id"),
    ),
    publicRead("education", () =>
      client
        .from("education")
        .select(
          "id,institution,qualification,date_label,description,url,media_id,sort_order,is_visible",
        )
        .eq("is_visible", true)
        .order("sort_order")
        .order("id"),
    ),
    publicRead("certifications", () =>
      client
        .from("certifications")
        .select(
          "id,name,issuer,date_label,credential_url,media_id,sort_order,is_visible",
        )
        .eq("is_visible", true)
        .order("sort_order")
        .order("id"),
    ),
    publicRead("achievements", () =>
      client
        .from("achievements")
        .select("id,title,result,date_label,bullets,url,sort_order,is_visible")
        .eq("is_visible", true)
        .order("sort_order")
        .order("id"),
    ),
    publicRead("skillGroups", () =>
      client
        .from("skill_groups")
        .select("id,name,sort_order,is_visible")
        .eq("is_visible", true)
        .order("sort_order")
        .order("id"),
    ),
    publicRead("skills", () =>
      client
        .from("skills")
        .select("id,group_id,name,description,logo_url,sort_order,is_visible")
        .eq("is_visible", true)
        .order("sort_order")
        .order("id"),
    ),
    publicRead("interests", () =>
      client
        .from("interests")
        .select("id,name,icon,color,sort_order,is_visible")
        .eq("is_visible", true)
        .order("sort_order")
        .order("id"),
    ),
    publicRead("socials", () =>
      client
        .from("social_links")
        .select("id,label,url,icon,placement,sort_order,is_visible")
        .eq("is_visible", true)
        .order("sort_order")
        .order("id"),
    ),
    publicRead("documents", () =>
      client
        .from("document_links")
        .select("id,title,description,url,media_id,sort_order,is_visible")
        .eq("is_visible", true)
        .order("sort_order")
        .order("id"),
    ),
    publicRead("navigation", () =>
      client
        .from("navigation_items")
        .select("id,label,section_key,sort_order,is_visible")
        .eq("is_visible", true)
        .order("sort_order")
        .order("id"),
    ),
  ]);
  return {
    ...toPublicPortfolio(
      {
        labels: labels,
        settings: {
          ...settings,
          canonical_url:
            settings.canonical_url ||
            safeLink(process.env.NEXT_PUBLIC_SITE_URL) ||
            "",
        },
        sections: sections,
        projects: projects,
        media: media,
        gallery: gallery,
        facts: facts,
        experience: experience,
        education: education,
        certifications: certifications,
        achievements: achievements,
        skillGroups: skillGroups,
        skills: skills,
        interests: interests,
        socials: socials,
        documents: documents,
        navigation: navigation,
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
