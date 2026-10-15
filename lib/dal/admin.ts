import "server-only";
import { toPublicPortfolio, publicMedia } from "@/lib/content/public-model";
import { readSupabaseConfig } from "@/lib/security/runtime-config";
import { requireAdmin, requireAdminPage } from "@/lib/auth/require-admin";
import {
  idSchema,
  revisionSchema,
  projectSchema,
  settingsSchema,
  gallerySchema,
} from "@/lib/validations/admin";

export class ContentError extends Error {}
function check(error: { code?: string } | null) {
  if (!error) return;
  if (error.code === "23505")
    throw new ContentError("That slug or gallery image is already in use.");
  console.error("Admin content operation failed", {
    code: error.code || "unknown",
  });
  throw new ContentError("Unable to save or load content. Please try again.");
}
const conflict = () =>
  new ContentError(
    "This record changed or was removed. Reload the page before saving again.",
  );

export async function getAdminProjects() {
  const { supabase } = await requireAdminPage();
  const { data, error } = await supabase
    .from("projects")
    .select("id,title,slug,status,sort_order,featured,updated_at")
    .order("sort_order")
    .order("id");
  check(error);
  return data || [];
}
export async function getAdminSettings() {
  const { supabase } = await requireAdminPage();
  const { data, error } = await supabase
    .from("site_settings")
    .select("*")
    .eq("id", true)
    .single();
  check(error);
  if (!data)
    throw new ContentError(
      "Site settings are missing. Run the documented seed setup.",
    );
  return data;
}
export async function getAdminProject(rawId: string) {
  const { supabase } = await requireAdminPage();
  const id = idSchema.safeParse(rawId);
  if (!id.success) return null;
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id.data)
    .maybeSingle();
  check(error);
  return data;
}
export async function getAdminMedia() {
  const { supabase } = await requireAdminPage();
  const { data, error } = await supabase
    .from("media_assets")
    .select("id,label,kind,is_public")
    .eq("pending_delete", false)
    .order("label");
  check(error);
  return data || [];
}
export async function getAdminGallery(rawId: string) {
  const { supabase } = await requireAdminPage();
  const id = idSchema.parse(rawId);
  const { data, error } = await supabase
    .from("project_media")
    .select("id,media_id,caption,sort_order")
    .eq("project_id", id)
    .order("sort_order")
    .order("id");
  check(error);
  return data || [];
}

export async function getAdminProjectPreview(rawId: string) {
  const { supabase } = await requireAdminPage();
  const project = await getAdminProject(rawId);
  if (!project) return null;
  const [settings, media, gallery, labels] = await Promise.all([
    getAdminSettings(),
    supabase.from("media_assets").select("*").eq("pending_delete", false),
    supabase
      .from("project_media")
      .select("*")
      .eq("project_id", project.id)
      .order("sort_order")
      .order("id"),
    supabase.from("public_labels").select("key,value"),
  ]);
  check(media.error);
  check(gallery.error);
  check(labels.error);
  const portfolio = toPublicPortfolio(
    {
      labels: labels.data || [],
      settings,
      projects: [
        {
          ...project,
          status: "published",
          published_at: "2000-01-01T00:00:00Z",
        },
      ],
      media: media.data || [],
      gallery: gallery.data || [],
      sections: [],
      facts: [],
      experience: [],
      education: [],
      certifications: [],
      achievements: [],
      skillGroups: [],
      skills: [],
      interests: [],
      socials: [],
      documents: [],
      navigation: [],
    },
    readSupabaseConfig().url,
  );
  const view = portfolio.projects[0];
  const previewImage = (id: string | null) => {
    const asset = (media.data || []).find((item) => item.id === id);
    if (asset?.kind !== "image") return null;
    return (
      publicMedia(asset, readSupabaseConfig().url) ||
      (asset.bucket === "portfolio-private"
        ? {
            src: `/admin/media/${asset.id}/file`,
            alt: asset.alt_text || asset.label,
            width: asset.width || 640,
            height: asset.height || 480,
            kind: asset.kind,
          }
        : null)
    );
  };
  return {
    project: {
      ...view,
      cover: previewImage(project.cover_media_id),
      gallery: (gallery.data || []).flatMap((item) => {
        const image = previewImage(item.media_id);
        return image ? [{ image, caption: item.caption }] : [];
      }),
    },
    copy: portfolio.copy,
  };
}

async function validateImages(
  supabase: Awaited<ReturnType<typeof requireAdmin>>["supabase"],
  ids: (string | null)[],
  mustBePublic: boolean,
) {
  const unique = [...new Set(ids.filter((id): id is string => !!id))];
  if (!unique.length) return;
  const { data, error } = await supabase
    .from("media_assets")
    .select("id,kind,is_public")
    .eq("pending_delete", false)
    .in("id", unique);
  check(error);
  if (
    data?.length !== unique.length ||
    data.some(
      (asset) => asset.kind !== "image" || (mustBePublic && !asset.is_public),
    )
  )
    throw new ContentError(
      "Choose existing image assets. Published content requires public images.",
    );
}
export async function updateSiteSettings(raw: unknown, rawRevision: unknown) {
  const { supabase } = await requireAdmin({ writeCookies: true });
  const value = settingsSchema.parse(raw);
  const revision = revisionSchema.parse(rawRevision);
  await validateImages(
    supabase,
    [value.profile_media_id, value.icon_media_id, value.seo_image_media_id],
    true,
  );
  const { data, error } = await supabase
    .from("site_settings")
    .update(value)
    .eq("id", true)
    .eq("updated_at", revision)
    .select("updated_at")
    .maybeSingle();
  check(error);
  if (!data) throw conflict();
  return data;
}
export async function saveProject(
  raw: unknown,
  rawId: unknown,
  rawRevision: unknown,
) {
  const { supabase } = await requireAdmin({ writeCookies: true });
  const value = projectSchema.parse(raw);
  const id = rawId ? idSchema.parse(rawId) : null;
  const revision = id ? revisionSchema.parse(rawRevision) : null;
  let oldSlug: string | null = null;
  let galleryIds: string[] = [];
  if (id) {
    const { data: old, error } = await supabase
      .from("projects")
      .select("slug")
      .eq("id", id)
      .eq("updated_at", revision || "")
      .maybeSingle();
    check(error);
    if (!old) throw conflict();
    oldSlug = old.slug;
    const { data: gallery, error: galleryError } = await supabase
      .from("project_media")
      .select("media_id")
      .eq("project_id", id);
    check(galleryError);
    galleryIds = (gallery || []).map((item) => item.media_id);
  }
  await validateImages(
    supabase,
    [value.cover_media_id, ...galleryIds],
    value.status === "published",
  );
  const query = id
    ? supabase
        .from("projects")
        .update(value)
        .eq("id", id)
        .eq("updated_at", revision || "")
    : supabase.from("projects").insert(value);
  const { data, error } = await query
    .select("id,slug,updated_at")
    .maybeSingle();
  check(error);
  if (!data) throw conflict();
  return { ...data, oldSlug };
}
export async function deleteProject(
  rawId: unknown,
  rawRevision: unknown,
  confirmation: unknown,
) {
  const { supabase } = await requireAdmin({ writeCookies: true });
  const id = idSchema.parse(rawId);
  const revision = revisionSchema.parse(rawRevision);
  const slug = projectSchema.shape.slug.parse(confirmation);
  const { data, error } = await supabase
    .from("projects")
    .delete()
    .eq("id", id)
    .eq("updated_at", revision)
    .eq("slug", slug)
    .select("slug")
    .maybeSingle();
  check(error);
  if (!data)
    throw new ContentError(
      "Confirmation did not match, or this record changed. Reload before deleting.",
    );
  return data;
}
export async function saveProjectImage(raw: unknown) {
  const { supabase } = await requireAdmin({ writeCookies: true });
  const value = gallerySchema.parse(raw);
  const { data: project, error: readError } = await supabase
    .from("projects")
    .select("slug,status")
    .eq("id", value.project_id)
    .single();
  check(readError);
  if (!project) throw conflict();
  await validateImages(
    supabase,
    [value.media_id],
    project.status === "published",
  );
  const { error } = await supabase
    .from("project_media")
    .upsert(value, { onConflict: "project_id,media_id" });
  check(error);
  return project.slug;
}
export async function removeProjectImage(
  rawId: unknown,
  rawProjectId: unknown,
) {
  const { supabase } = await requireAdmin({ writeCookies: true });
  const id = idSchema.parse(rawId);
  const projectId = idSchema.parse(rawProjectId);
  const { data, error } = await supabase
    .from("project_media")
    .delete()
    .eq("id", id)
    .eq("project_id", projectId)
    .select("id")
    .maybeSingle();
  check(error);
  if (!data) throw conflict();
}
