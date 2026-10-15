import "server-only";
import { requireAdmin, requireAdminPage } from "@/lib/auth/require-admin";
import { ContentError } from "@/lib/dal/admin";
import { idSchema, revisionSchema } from "@/lib/validations/admin";
import { uploadMetadata, validateUpload } from "@/lib/validations/upload";

function check(error: { code?: string } | Error | null) {
  if (!error) return;
  const code =
    "code" in error
      ? error.code
      : error instanceof Error
        ? error.name
        : "provider";
  if (code === "23503")
    throw new ContentError(
      "This asset is still in use. Replace or remove every reference before deleting it.",
    );
  console.error("Media operation failed", { code: code || "provider" });
  throw new ContentError(
    "Media could not be saved or removed. Please retry; existing references are retained.",
  );
}
export async function getMediaLibrary() {
  const { supabase } = await requireAdminPage();
  const { data, error } = await supabase
    .from("media_assets")
    .select("*")
    .order("created_at", { ascending: false })
    .order("id");
  check(error);
  return data || [];
}
export async function uploadMedia(raw: unknown, file: unknown) {
  const { supabase, userId } = await requireAdmin({ writeCookies: true });
  const value = uploadMetadata.parse(raw);
  if (!(file instanceof File))
    throw new ContentError("Choose a file to upload.");
  const verified = await validateUpload(file);
  const id = crypto.randomUUID();
  const bucket =
    value.visibility === "public" ? "portfolio-public" : "portfolio-private";
  const path = `${userId}/${id}.${verified.extension}`;
  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, verified.bytes, {
      contentType: verified.mime,
      upsert: false,
      cacheControl: "3600",
    });
  check(error);
  const { error: insertError } = await supabase.from("media_assets").insert({
    id,
    label: value.label,
    alt_text: value.alt_text,
    kind: verified.kind,
    bucket,
    object_path: path,
    mime_type: verified.mime,
    size_bytes: verified.bytes.length,
    width: verified.width,
    height: verified.height,
    is_public: value.visibility === "public",
  });
  if (insertError) {
    // Keep a truthful failure. Untracked bytes require operator cleanup; no unsafe delete bypass.
    console.error(
      "Media uploaded but metadata insert failed; operator cleanup needed",
      { bucket, objectId: id, code: insertError.code },
    );
    throw new ContentError(
      "The upload could not be registered. No content references changed. Ask the operator to clean up the unregistered upload before retrying.",
    );
  }
  return id;
}
export async function updateMediaText(
  rawId: unknown,
  rawRevision: unknown,
  raw: unknown,
) {
  const { supabase } = await requireAdmin({ writeCookies: true });
  const id = idSchema.parse(rawId),
    revision = revisionSchema.parse(rawRevision);
  const value = uploadMetadata.pick({ label: true, alt_text: true }).parse(raw);
  const { data, error } = await supabase
    .from("media_assets")
    .update(value)
    .eq("id", id)
    .eq("updated_at", revision)
    .eq("pending_delete", false)
    .select("updated_at")
    .maybeSingle();
  check(error);
  if (!data)
    throw new ContentError("This asset changed. Reload before saving again.");
  return data.updated_at;
}
export async function createPublicCopy(rawId: unknown, confirmation: unknown) {
  const { supabase, userId } = await requireAdmin({ writeCookies: true });
  if (confirmation !== "on")
    throw new ContentError(
      "Confirm that the copy will be publicly accessible.",
    );
  const id = idSchema.parse(rawId);
  const { data: asset, error } = await supabase
    .from("media_assets")
    .select("*")
    .eq("id", id)
    .eq("pending_delete", false)
    .single();
  check(error);
  if (asset?.bucket !== "portfolio-private" || !asset.object_path)
    throw new ContentError("Choose a private uploaded asset.");
  const downloaded = await supabase.storage
    .from(asset.bucket)
    .download(asset.object_path);
  check(downloaded.error);
  if (!downloaded.data)
    throw new ContentError(
      "Unable to read the original file. No references changed.",
    );
  const verified = await validateUpload(
    new File([downloaded.data], asset.object_path.split("/").pop() || "", {
      type: asset.mime_type,
    }),
  );
  const newId = crypto.randomUUID(),
    path = `${userId}/${newId}.${verified.extension}`;
  const result = await supabase.storage
    .from("portfolio-public")
    .upload(path, verified.bytes, {
      contentType: verified.mime,
      upsert: false,
      cacheControl: "3600",
    });
  check(result.error);
  const inserted = await supabase.from("media_assets").insert({
    id: newId,
    label: `${asset.label.slice(0, 186)} (public copy)`,
    alt_text: asset.alt_text,
    kind: verified.kind,
    mime_type: verified.mime,
    size_bytes: verified.bytes.length,
    width: verified.width,
    height: verified.height,
    bucket: "portfolio-public",
    object_path: path,
    is_public: true,
  });
  if (inserted.error) {
    console.error(
      "Public copy metadata insert failed; operator cleanup needed",
      { objectId: newId, code: inserted.error.code },
    );
    throw new ContentError(
      "The public copy could not be registered. Original references are unchanged; operator cleanup is required.",
    );
  }
}
export async function deleteMedia(
  rawId: unknown,
  rawRevision: unknown,
  confirmation: unknown,
) {
  const { supabase } = await requireAdmin({ writeCookies: true });
  if (confirmation !== "on")
    throw new ContentError("Confirm permanent asset removal first.");
  const id = idSchema.parse(rawId),
    revision = revisionSchema.parse(rawRevision);
  const marked = await supabase
    .from("media_assets")
    .update({ pending_delete: true })
    .eq("id", id)
    .eq("updated_at", revision)
    .select("*")
    .maybeSingle();
  check(marked.error);
  if (!marked.data)
    throw new ContentError("This asset changed. Reload before removing it.");
  const asset = marked.data;
  if (asset.bucket && asset.object_path) {
    const removed = await supabase.storage
      .from(asset.bucket)
      .remove([asset.object_path]);
    check(removed.error);
    const remaining = await supabase.storage
      .from(asset.bucket)
      .info(asset.object_path);
    if (!remaining.error || String(remaining.error.statusCode) !== "404")
      throw new ContentError(
        "File removal is incomplete. Reload and retry cleanup; this asset cannot be selected for content.",
      );
  }
  const removed = await supabase
    .from("media_assets")
    .delete()
    .eq("id", id)
    .eq("pending_delete", true)
    .select("id")
    .maybeSingle();
  check(removed.error);
  if (!removed.data)
    throw new ContentError("Cleanup is incomplete. Reload and retry.");
}
export async function getPrivateMedia(rawId: string) {
  const { supabase } = await requireAdmin();
  const id = idSchema.parse(rawId);
  const { data: asset, error } = await supabase
    .from("media_assets")
    .select("bucket,object_path,mime_type,label")
    .eq("id", id)
    .eq("pending_delete", false)
    .maybeSingle();
  check(error);
  if (!asset?.bucket || !asset.object_path) return null;
  const downloaded = await supabase.storage
    .from(asset.bucket)
    .download(asset.object_path);
  check(downloaded.error);
  return downloaded.data
    ? { file: downloaded.data, mime: asset.mime_type, label: asset.label }
    : null;
}
