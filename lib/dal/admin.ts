import { galleryImages } from "./gallery";
import "server-only";
import { requireAdminPage } from "@/lib/auth/require-admin-page";
import { requireAdmin } from "@/lib/auth/require-admin";
import { ContentError } from "@/lib/admin/errors";
import { resolveMediaReference } from "./admin-media";
import {
  projectInputSchema,
  settingsInputSchema,
  recordId,
  recordVersion,
} from "@/lib/validations/admin-content";
import type { PostgrestError } from "@supabase/supabase-js";

function fail(error: PostgrestError | null) {
  if (!error) return;
  if (error.code === "23505")
    throw new ContentError(
      "This slug or settings record already exists. Use a unique slug or reload.",
    );
  console.error("Admin database request failed", { code: error.code });
  throw new ContentError("Could not save this change. Please try again.");
}
export async function getAdminProjects() {
  const { supabase } = await requireAdminPage();
  const { data, error } = await supabase
    .from("projects")
    .select("id,title,slug,status,featured,sort_order,updated_at")
    .order("sort_order")
    .order("title");
  fail(error);
  return data ?? [];
}
export async function getAdminProject(id: string) {
  const { supabase } = await requireAdminPage();
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("id", recordId.parse(id))
    .maybeSingle();
  fail(error);
  return data;
}
export async function getAdminSettings() {
  const { supabase } = await requireAdminPage();
  const { data, error } = await supabase
    .from("site_settings")
    .select("*")
    .eq("id", 1)
    .maybeSingle();
  fail(error);
  return data;
}
export async function saveProject(
  input: unknown,
  id: string | null,
  version: string | null,
) {
  const { supabase } = await requireAdmin({ writable: true });
  const value = projectInputSchema.parse(input);
  const cover_media_id = await resolveMediaReference(value.cover_image, true);
  if (id) {
    recordId.parse(id);
    recordVersion.parse(version);
    const { data: old, error: readError } = await supabase
      .from("projects")
      .select("slug,published_at")
      .eq("id", id)
      .maybeSingle();
    fail(readError);
    if (!old)
      throw new ContentError(
        "This project is unavailable. Reload the project list.",
      );
    const published_at =
      value.status === "published"
        ? (old.published_at ?? new Date().toISOString())
        : null;
    const { data, error } = await supabase
      .from("projects")
      .update({ ...value, cover_media_id, published_at })
      .eq("id", id)
      .eq("updated_at", version ?? "")
      .select("id,slug,updated_at")
      .maybeSingle();
    fail(error);
    if (!data)
      throw new ContentError(
        "This project changed in another tab. Reload before saving.",
      );
    return {
      ...data,
      oldSlug: old.slug,
      values: { ...value, technologies: value.technologies.join(", ") },
    };
  }
  if (version) throw new ContentError("Invalid new-project revision.");
  const { data, error } = await supabase
    .from("projects")
    .insert({
      ...value,
      cover_media_id,
      published_at:
        value.status === "published" ? new Date().toISOString() : null,
    })
    .select("id,slug,updated_at")
    .single();
  fail(error);
  if (!data) throw new ContentError("The project could not be created.");
  return {
    ...data,
    oldSlug: null,
    values: { ...value, technologies: value.technologies.join(", ") },
  };
}
export async function deleteProject(
  id: string,
  version: string,
  confirmation: string,
) {
  const { supabase } = await requireAdmin({ writable: true });
  recordId.parse(id);
  recordVersion.parse(version);
  const { data: project, error: readError } = await supabase
    .from("projects")
    .select("title,slug")
    .eq("id", id)
    .maybeSingle();
  fail(readError);
  if (!project || confirmation !== project.title)
    throw new ContentError(
      "Enter the exact project title to confirm deletion.",
    );
  const { data, error } = await supabase
    .from("projects")
    .delete()
    .eq("id", id)
    .eq("updated_at", version)
    .select("id")
    .maybeSingle();
  fail(error);
  if (!data)
    throw new ContentError("This project changed. Reload before deleting.");
  return project.slug;
}
export async function saveSettings(input: unknown, version: string | null) {
  const { supabase } = await requireAdmin({ writable: true });
  const value = settingsInputSchema.parse(input);
  const profile_media_id = await resolveMediaReference(
    value.profile_image,
    true,
  );
  const favicon_media_id = await resolveMediaReference(
    value.favicon_image,
    true,
  );
  const social_preview_media_id = await resolveMediaReference(
    value.social_preview_image,
    true,
  );
  if (version) {
    recordVersion.parse(version);
    const { data, error } = await supabase
      .from("site_settings")
      .update({
        ...value,
        profile_media_id,
        favicon_media_id,
        social_preview_media_id,
      })
      .eq("id", 1)
      .eq("updated_at", version)
      .select("updated_at")
      .maybeSingle();
    fail(error);
    if (!data)
      throw new ContentError(
        "Settings changed in another tab. Reload before saving.",
      );
    return { ...data, values: value };
  }
  const { data, error } = await supabase
    .from("site_settings")
    .insert({
      ...value,
      profile_media_id,
      favicon_media_id,
      social_preview_media_id,
      id: 1,
    })
    .select("updated_at")
    .single();
  fail(error);
  if (!data) throw new ContentError("Settings could not be created.");
  return { ...data, values: value };
}

export async function getAdminProjectGallery(id: string) {
  const { supabase } = await requireAdminPage();
  recordId.parse(id);
  const { data: entries, error } = await supabase
    .from("project_media")
    .select("media_id,caption")
    .eq("project_id", id)
    .order("sort_order");
  fail(error);
  if (!entries?.length) return [];
  const { data: assets, error: assetError } = await supabase
    .from("media_assets")
    .select("id,bucket,object_path,alt_text,mime_type,width,height")
    .eq("is_public", true)
    .eq("bucket", "portfolio-public")
    .in(
      "id",
      entries.map((item) => item.media_id),
    );
  fail(assetError);
  return galleryImages(entries, assets ?? []);
}
