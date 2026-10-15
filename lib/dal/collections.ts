import "server-only";
import { requireAdmin, requireAdminPage } from "@/lib/auth/require-admin";
import { ContentError } from "@/lib/dal/admin";
import {
  collectionSchemas,
  collectionNameSchema,
  collectionId,
} from "@/lib/validations/collections";
import { revisionSchema } from "@/lib/validations/admin";

function check(error: { code?: string } | null) {
  if (!error) return;
  if (error.code === "23505")
    throw new ContentError("That section already has a navigation item.");
  if (error.code === "23503")
    throw new ContentError(
      "This item is still referenced. Remove or reassign its dependent items first.",
    );
  console.error("Collection operation failed", {
    code: error.code || "unknown",
  });
  throw new ContentError("Unable to save or load this item. Please try again.");
}
export async function getAdminCollection(rawName: string) {
  const { supabase } = await requireAdminPage();
  const name = collectionNameSchema.parse(rawName);
  const { data, error } =
    name === "public_labels"
      ? await supabase.from("public_labels").select("*").order("key")
      : await supabase
          .from(name)
          .select("*")
          .order("sort_order")
          .order(name === "section_settings" ? "key" : "id");
  check(error);
  return data || [];
}
export async function saveCollection(
  rawName: unknown,
  rawId: unknown,
  rawRevision: unknown,
  raw: unknown,
) {
  const { supabase } = await requireAdmin({ writeCookies: true });
  const name = collectionNameSchema.parse(rawName);
  const id = rawId ? collectionId(name).parse(rawId) : null;
  const revision = id ? revisionSchema.parse(rawRevision) : null;
  const value = collectionSchemas[name].parse(raw);
  if ("media_id" in value && value.media_id) {
    const { data: asset, error } = await supabase
      .from("media_assets")
      .select("kind,is_public")
      .eq("pending_delete", false)
      .eq("id", value.media_id)
      .single();
    check(error);
    if (
      !asset ||
      ("is_visible" in value && value.is_visible && !asset.is_public) ||
      (name !== "document_links" && asset.kind !== "image")
    )
      throw new ContentError(
        "Visible items require a public asset of the correct type.",
      );
  }
  let result: {
    data: { id?: string; key?: string; updated_at: string } | null;
    error: { code?: string } | null;
  };
  switch (name) {
    case "public_labels": {
      const input = collectionSchemas.public_labels.parse(raw);
      if (!id) throw new ContentError("Display label keys are fixed.");
      result = await supabase
        .from("public_labels")
        .update(input)
        .eq("key", id)
        .eq("updated_at", revision || "")
        .select("key,updated_at")
        .maybeSingle();
      break;
    }

    case "profile_facts": {
      const input = collectionSchemas.profile_facts.parse(raw);
      result = id
        ? await supabase
            .from("profile_facts")
            .update(input)
            .eq("id", id)
            .eq("updated_at", revision || "")
            .select("id,updated_at")
            .maybeSingle()
        : await supabase
            .from("profile_facts")
            .insert(input)
            .select("id,updated_at")
            .single();
      break;
    }
    case "section_settings": {
      const input = collectionSchemas.section_settings.parse(raw);
      if (!id)
        throw new ContentError(
          "Section keys are fixed. Edit an existing section instead.",
        );
      result = id
        ? await supabase
            .from("section_settings")
            .update(input)
            .eq("key", id)
            .eq("updated_at", revision || "")
            .select("key,updated_at")
            .maybeSingle()
        : { data: null, error: null };
      break;
    }
    case "navigation_items": {
      const input = collectionSchemas.navigation_items.parse(raw);
      result = id
        ? await supabase
            .from("navigation_items")
            .update(input)
            .eq("id", id)
            .eq("updated_at", revision || "")
            .select("id,updated_at")
            .maybeSingle()
        : await supabase
            .from("navigation_items")
            .insert(input)
            .select("id,updated_at")
            .single();
      break;
    }
    case "experiences": {
      const input = collectionSchemas.experiences.parse(raw);
      result = id
        ? await supabase
            .from("experiences")
            .update(input)
            .eq("id", id)
            .eq("updated_at", revision || "")
            .select("id,updated_at")
            .maybeSingle()
        : await supabase
            .from("experiences")
            .insert(input)
            .select("id,updated_at")
            .single();
      break;
    }
    case "education": {
      const input = collectionSchemas.education.parse(raw);
      result = id
        ? await supabase
            .from("education")
            .update(input)
            .eq("id", id)
            .eq("updated_at", revision || "")
            .select("id,updated_at")
            .maybeSingle()
        : await supabase
            .from("education")
            .insert(input)
            .select("id,updated_at")
            .single();
      break;
    }
    case "certifications": {
      const input = collectionSchemas.certifications.parse(raw);
      result = id
        ? await supabase
            .from("certifications")
            .update(input)
            .eq("id", id)
            .eq("updated_at", revision || "")
            .select("id,updated_at")
            .maybeSingle()
        : await supabase
            .from("certifications")
            .insert(input)
            .select("id,updated_at")
            .single();
      break;
    }
    case "achievements": {
      const input = collectionSchemas.achievements.parse(raw);
      result = id
        ? await supabase
            .from("achievements")
            .update(input)
            .eq("id", id)
            .eq("updated_at", revision || "")
            .select("id,updated_at")
            .maybeSingle()
        : await supabase
            .from("achievements")
            .insert(input)
            .select("id,updated_at")
            .single();
      break;
    }
    case "skill_groups": {
      const input = collectionSchemas.skill_groups.parse(raw);
      result = id
        ? await supabase
            .from("skill_groups")
            .update(input)
            .eq("id", id)
            .eq("updated_at", revision || "")
            .select("id,updated_at")
            .maybeSingle()
        : await supabase
            .from("skill_groups")
            .insert(input)
            .select("id,updated_at")
            .single();
      break;
    }
    case "skills": {
      const input = collectionSchemas.skills.parse(raw);
      result = id
        ? await supabase
            .from("skills")
            .update(input)
            .eq("id", id)
            .eq("updated_at", revision || "")
            .select("id,updated_at")
            .maybeSingle()
        : await supabase
            .from("skills")
            .insert(input)
            .select("id,updated_at")
            .single();
      break;
    }
    case "interests": {
      const input = collectionSchemas.interests.parse(raw);
      result = id
        ? await supabase
            .from("interests")
            .update(input)
            .eq("id", id)
            .eq("updated_at", revision || "")
            .select("id,updated_at")
            .maybeSingle()
        : await supabase
            .from("interests")
            .insert(input)
            .select("id,updated_at")
            .single();
      break;
    }
    case "social_links": {
      const input = collectionSchemas.social_links.parse(raw);
      result = id
        ? await supabase
            .from("social_links")
            .update(input)
            .eq("id", id)
            .eq("updated_at", revision || "")
            .select("id,updated_at")
            .maybeSingle()
        : await supabase
            .from("social_links")
            .insert(input)
            .select("id,updated_at")
            .single();
      break;
    }
    case "document_links": {
      const input = collectionSchemas.document_links.parse(raw);
      result = id
        ? await supabase
            .from("document_links")
            .update(input)
            .eq("id", id)
            .eq("updated_at", revision || "")
            .select("id,updated_at")
            .maybeSingle()
        : await supabase
            .from("document_links")
            .insert(input)
            .select("id,updated_at")
            .single();
      break;
    }
  }
  check(result.error);
  if (!result.data)
    throw new ContentError(
      "This item changed or was removed. Reload before saving again.",
    );
  return {
    id: result.data.id || result.data.key || "",
    revision: result.data.updated_at,
  };
}
export async function deleteCollection(
  rawName: unknown,
  rawId: unknown,
  rawRevision: unknown,
  confirmation: unknown,
) {
  const { supabase } = await requireAdmin({ writeCookies: true });
  const name = collectionNameSchema.parse(rawName);
  if (name === "section_settings" || name === "public_labels")
    throw new ContentError(
      "Sections cannot be deleted. Hide the section instead.",
    );
  const id = collectionId(name).parse(rawId);
  const revision = revisionSchema.parse(rawRevision);
  if (confirmation !== "on")
    throw new ContentError("Confirm permanent deletion first.");
  if (name === "skill_groups") {
    const { count, error } = await supabase
      .from("skills")
      .select("id", { head: true, count: "exact" })
      .eq("group_id", id);
    check(error);
    if (count)
      throw new ContentError(
        "Move or delete this group's skills before removing it.",
      );
  }
  const { data, error } = await supabase
    .from(name)
    .delete()
    .eq("id", id)
    .eq("updated_at", revision)
    .select("id")
    .maybeSingle();
  check(error);
  if (!data)
    throw new ContentError(
      "This item changed or was removed. Reload before deleting again.",
    );
}
