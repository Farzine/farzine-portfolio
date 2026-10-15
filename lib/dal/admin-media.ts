import "server-only";
import { randomUUID } from "node:crypto";
import { requireAdmin } from "@/lib/auth/require-admin";
import { requireAdminPage } from "@/lib/auth/require-admin-page";
import { getLegacyImages, validateLegacyImage } from "@/lib/admin/images";
import { ContentError } from "@/lib/admin/errors";
import {
  uploadDetails,
  prepareUpload,
  UploadValidationError,
} from "@/lib/validations/upload";
import { recordId, recordVersion } from "@/lib/validations/admin-content";
import { getSupabaseConfig } from "@/lib/supabase/config";
export async function getAdminMedia() {
  const { supabase } = await requireAdminPage();
  const { data, error } = await supabase
    .from("media_assets")
    .select("*")
    .order("created_at", { ascending: false });
  if (error)
    throw new ContentError("Media library could not be loaded. Try again.");
  return (data ?? []).map((item) => ({
    ...item,
    url: item.is_public
      ? supabase.storage.from(item.bucket).getPublicUrl(item.object_path).data
          .publicUrl
      : null,
  }));
}
export async function getAdminImageChoices() {
  const media = await getAdminMedia();
  return [
    ...getLegacyImages(),
    ...media
      .filter((item) => item.is_public && item.mime_type.startsWith("image/"))
      .map((item) => item.url)
      .filter((url): url is string => Boolean(url)),
  ];
}
export async function resolveMediaReference(
  value: string,
  imageOnly = false,
): Promise<string | null> {
  const { supabase } = await requireAdmin({ writable: true });
  if (!value) return null;
  if (value.startsWith("/assets/img/")) {
    validateLegacyImage(value);
    return null;
  }
  const config = getSupabaseConfig();
  if (!config) throw new ContentError("Supabase is unavailable.");
  const base = `${config.url}/storage/v1/object/public/portfolio-public/`;
  if (!value.startsWith(base)) {
    if (imageOnly)
      throw new ContentError("Select a public image from the media library.");
    return null;
  }
  const objectPath = value.slice(base.length);
  const { data, error } = await supabase
    .from("media_assets")
    .select("id,mime_type,is_public,bucket")
    .eq("object_path", objectPath)
    .maybeSingle();
  if (
    error ||
    !data ||
    !data.is_public ||
    data.bucket !== "portfolio-public" ||
    (imageOnly && !data.mime_type.startsWith("image/"))
  )
    throw new ContentError(
      "Choose an available public asset from the library.",
    );
  return data.id;
}
export async function uploadMedia(file: File, input: unknown) {
  const { supabase } = await requireAdmin({ writable: true });
  const details = uploadDetails.parse(input);
  let asset: Awaited<ReturnType<typeof prepareUpload>>;
  try {
    asset = await prepareUpload(file);
  } catch (error) {
    throw new ContentError(
      error instanceof UploadValidationError
        ? error.message
        : "The file could not be decoded. Choose a valid raster image.",
    );
  }
  const id = randomUUID();
  const bucket = details.is_public ? "portfolio-public" : "portfolio-private";
  const path = `${randomUUID()}/${id}.${asset.extension}`;
  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(path, asset.bytes, {
      contentType: asset.mime_type,
      upsert: false,
      cacheControl: "31536000",
    });
  if (uploadError) {
    console.error("Media upload failed", { code: uploadError.name });
    throw new ContentError(
      "The upload was not confirmed. Please retry or check Storage before removing any orphan file.",
    );
  }
  const { data, error } = await supabase
    .from("media_assets")
    .insert({
      id,
      bucket,
      object_path: path,
      ...details,
      mime_type: asset.mime_type,
      byte_size: asset.bytes.length,
      width: asset.width,
      height: asset.height,
    })
    .select("id")
    .single();
  if (error || !data) {
    const { error: cleanup } = await supabase.storage
      .from(bucket)
      .remove([path]);
    if (cleanup) console.error("Orphan upload cleanup failed", { assetId: id });
    throw new ContentError(
      "The asset could not be registered in the library. Try again.",
    );
  }
  return id;
}
export async function deleteMedia(
  id: string,
  version: string,
  confirmation: string,
) {
  const { supabase } = await requireAdmin({ writable: true });
  recordId.parse(id);
  recordVersion.parse(version);
  const { data: old, error: readError } = await supabase
    .from("media_assets")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (readError || !old || confirmation !== old.alt_text)
    throw new ContentError(
      "Enter the exact asset description to confirm deletion.",
    );
  // Delete metadata first: RESTRICT foreign keys close the race with concurrent references.
  const { data, error } = await supabase
    .from("media_assets")
    .delete()
    .eq("id", id)
    .eq("updated_at", version)
    .select("id")
    .maybeSingle();
  if (error?.code === "23001" || error?.code === "23503")
    throw new ContentError(
      "This asset is still referenced. Replace or remove every reference first.",
    );
  if (error || !data)
    throw new ContentError(
      "This asset changed or could not be removed. Reload the library.",
    );
  const { error: storageError } = await supabase.storage
    .from(old.bucket)
    .remove([old.object_path]);
  if (storageError) {
    const { error: restoreError } = await supabase
      .from("media_assets")
      .insert(old);
    console.error("Storage cleanup failed", {
      assetId: id,
      metadataRestored: !restoreError,
    });
    throw new ContentError(
      "Storage cleanup failed. Reload the library and retry; no content references were removed.",
    );
  }
}

export async function updateAssetDescription(
  input: unknown,
  id: string,
  version: string,
) {
  const { supabase } = await requireAdmin({ writable: true });
  recordId.parse(id);
  recordVersion.parse(version);
  const values = uploadDetails.pick({ alt_text: true }).parse(input);
  const { data, error } = await supabase
    .from("media_assets")
    .update(values)
    .eq("id", id)
    .eq("updated_at", version)
    .select("updated_at")
    .maybeSingle();
  if (error || !data)
    throw new ContentError("This asset changed. Reload before saving.");
  return { version: data.updated_at, values };
}
