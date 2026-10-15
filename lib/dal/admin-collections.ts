import "server-only";
import { requireAdmin } from "@/lib/auth/require-admin";
import { requireAdminPage } from "@/lib/auth/require-admin-page";
import { ContentError } from "@/lib/admin/errors";
import { resolveMediaReference } from "./admin-media";
import { collections } from "@/lib/admin/collections";
import {
  collectionKind,
  collectionInputSchema,
} from "@/lib/validations/admin-collections";
import { recordId, recordVersion } from "@/lib/validations/admin-content";
import type { PostgrestError } from "@supabase/supabase-js";
function fail(error: PostgrestError | null) {
  if (!error) return;
  if (error.code === "23505")
    throw new ContentError(
      "This section or named item already exists. Choose a unique value.",
    );
  if (["23503", "23001"].includes(error.code))
    throw new ContentError(
      "This item is referenced elsewhere. Remove its references before deleting, or choose a valid parent.",
    );
  console.error("Collection request failed", { code: error.code });
  throw new ContentError("Could not save this change. Please try again.");
}
export function editorValues(value: Record<string, unknown>) {
  const result: Record<string, string | number | boolean> = {};
  for (const [key, item] of Object.entries(value)) {
    if (Array.isArray(item) && item.every((entry) => typeof entry === "string"))
      result[key] = item.join("\n");
    else if (
      typeof item === "string" ||
      typeof item === "number" ||
      typeof item === "boolean"
    )
      result[key] = item;
  }
  return result;
}
export async function getAdminCollection(input: string) {
  const { supabase } = await requireAdminPage();
  const kind = collectionKind.parse(input);
  const query = (() => {
    switch (kind) {
      case "project_media":
        return supabase.from("project_media").select("*");
      case "experiences":
        return supabase.from("experiences").select("*");
      case "education":
        return supabase.from("education").select("*");
      case "certifications":
        return supabase.from("certifications").select("*");
      case "achievements":
        return supabase.from("achievements").select("*");
      case "skill_groups":
        return supabase.from("skill_groups").select("*");
      case "skills":
        return supabase.from("skills").select("*");
      case "interests":
        return supabase.from("interests").select("*");
      case "social_links":
        return supabase.from("social_links").select("*");
      case "navigation_items":
        return supabase.from("navigation_items").select("*");
      case "section_settings":
        return supabase.from("section_settings").select("*");
      case "profile_facts":
        return supabase.from("profile_facts").select("*");
    }
  })();
  const { data, error } = await query.order("sort_order").order("id");
  fail(error);
  return (data ?? []).map((row) => {
    const values = editorValues(row);
    const label = String(values[collections[kind].titleField] ?? "Untitled");
    return { id: row.id, version: row.updated_at, label, values };
  });
}
export async function saveCollection(
  input: unknown,
  id: string | null,
  version: string | null,
) {
  const { supabase } = await requireAdmin({ writable: true });
  const parsed = collectionInputSchema.parse(input);
  if (id) {
    recordId.parse(id);
    recordVersion.parse(version);
  } else if (version) throw new ContentError("Invalid new-item revision.");
  const image_media_id =
    "image" in parsed.value
      ? await resolveMediaReference(parsed.value.image, true)
      : null;
  const media_id =
    parsed.kind === "navigation_items"
      ? await resolveMediaReference(parsed.value.url)
      : null;
  if (parsed.kind === "project_media") {
    const { data: asset, error } = await supabase
      .from("media_assets")
      .select("is_public,bucket,mime_type")
      .eq("id", parsed.value.media_id)
      .maybeSingle();
    if (
      error ||
      !asset?.is_public ||
      asset.bucket !== "portfolio-public" ||
      !asset.mime_type.startsWith("image/")
    )
      throw new ContentError("Choose a public raster image from the library.");
  }
  const query = (() => {
    switch (parsed.kind) {
      case "project_media":
        return id
          ? supabase
              .from("project_media")
              .update(parsed.value)
              .eq("id", id)
              .eq("updated_at", version ?? "")
          : supabase.from("project_media").insert(parsed.value);
      case "experiences":
        return id
          ? supabase
              .from("experiences")
              .update(parsed.value)
              .eq("id", id)
              .eq("updated_at", version ?? "")
          : supabase.from("experiences").insert(parsed.value);
      case "education":
        return id
          ? supabase
              .from("education")
              .update({ ...parsed.value, image_media_id })
              .eq("id", id)
              .eq("updated_at", version ?? "")
          : supabase
              .from("education")
              .insert({ ...parsed.value, image_media_id });
      case "certifications":
        return id
          ? supabase
              .from("certifications")
              .update({ ...parsed.value, image_media_id })
              .eq("id", id)
              .eq("updated_at", version ?? "")
          : supabase
              .from("certifications")
              .insert({ ...parsed.value, image_media_id });
      case "achievements":
        return id
          ? supabase
              .from("achievements")
              .update(parsed.value)
              .eq("id", id)
              .eq("updated_at", version ?? "")
          : supabase.from("achievements").insert(parsed.value);
      case "skill_groups":
        return id
          ? supabase
              .from("skill_groups")
              .update(parsed.value)
              .eq("id", id)
              .eq("updated_at", version ?? "")
          : supabase.from("skill_groups").insert(parsed.value);
      case "skills":
        return id
          ? supabase
              .from("skills")
              .update(parsed.value)
              .eq("id", id)
              .eq("updated_at", version ?? "")
          : supabase.from("skills").insert(parsed.value);
      case "interests":
        return id
          ? supabase
              .from("interests")
              .update(parsed.value)
              .eq("id", id)
              .eq("updated_at", version ?? "")
          : supabase.from("interests").insert(parsed.value);
      case "social_links":
        return id
          ? supabase
              .from("social_links")
              .update(parsed.value)
              .eq("id", id)
              .eq("updated_at", version ?? "")
          : supabase.from("social_links").insert(parsed.value);
      case "navigation_items":
        return id
          ? supabase
              .from("navigation_items")
              .update({ ...parsed.value, media_id })
              .eq("id", id)
              .eq("updated_at", version ?? "")
          : supabase
              .from("navigation_items")
              .insert({ ...parsed.value, media_id });
      case "section_settings":
        return id
          ? supabase
              .from("section_settings")
              .update(parsed.value)
              .eq("id", id)
              .eq("updated_at", version ?? "")
          : supabase.from("section_settings").insert(parsed.value);
      case "profile_facts":
        return id
          ? supabase
              .from("profile_facts")
              .update(parsed.value)
              .eq("id", id)
              .eq("updated_at", version ?? "")
          : supabase.from("profile_facts").insert(parsed.value);
    }
  })();
  const { data, error } = await query.select("id,updated_at").maybeSingle();
  fail(error);
  if (!data)
    throw new ContentError(
      "This item changed in another tab. Reload before saving.",
    );
  return {
    id: data.id,
    version: data.updated_at,
    values: editorValues(parsed.value),
  };
}
export async function deleteCollection(
  input: string,
  id: string,
  version: string,
  confirmation: string,
) {
  const { supabase } = await requireAdmin({ writable: true });
  const kind = collectionKind.parse(input);
  recordId.parse(id);
  recordVersion.parse(version);
  const readQuery = (() => {
    switch (kind) {
      case "project_media":
        return supabase.from("project_media").select("*");
      case "experiences":
        return supabase.from("experiences").select("*");
      case "education":
        return supabase.from("education").select("*");
      case "certifications":
        return supabase.from("certifications").select("*");
      case "achievements":
        return supabase.from("achievements").select("*");
      case "skill_groups":
        return supabase.from("skill_groups").select("*");
      case "skills":
        return supabase.from("skills").select("*");
      case "interests":
        return supabase.from("interests").select("*");
      case "social_links":
        return supabase.from("social_links").select("*");
      case "navigation_items":
        return supabase.from("navigation_items").select("*");
      case "section_settings":
        return supabase.from("section_settings").select("*");
      case "profile_facts":
        return supabase.from("profile_facts").select("*");
    }
  })();
  const { data: old, error: readError } = await readQuery
    .eq("id", id)
    .maybeSingle();
  fail(readError);
  if (
    !old ||
    confirmation !== String(editorValues(old)[collections[kind].titleField])
  )
    throw new ContentError("Enter the exact item title to confirm deletion.");
  const query = (() => {
    switch (kind) {
      case "project_media":
        return supabase.from("project_media").delete();
      case "experiences":
        return supabase.from("experiences").delete();
      case "education":
        return supabase.from("education").delete();
      case "certifications":
        return supabase.from("certifications").delete();
      case "achievements":
        return supabase.from("achievements").delete();
      case "skill_groups":
        return supabase.from("skill_groups").delete();
      case "skills":
        return supabase.from("skills").delete();
      case "interests":
        return supabase.from("interests").delete();
      case "social_links":
        return supabase.from("social_links").delete();
      case "navigation_items":
        return supabase.from("navigation_items").delete();
      case "section_settings":
        return supabase.from("section_settings").delete();
      case "profile_facts":
        return supabase.from("profile_facts").delete();
    }
  })();
  const { data, error } = await query
    .eq("id", id)
    .eq("updated_at", version)
    .select("id")
    .maybeSingle();
  fail(error);
  if (!data)
    throw new ContentError("This item changed. Reload before deleting.");
  return kind;
}
