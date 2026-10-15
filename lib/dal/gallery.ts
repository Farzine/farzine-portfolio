import "server-only";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { publicGalleryImageSchema } from "@/lib/validations/public-content";
import type { Row } from "@/lib/types/database.generated";
export type GalleryEntry = Pick<Row<"project_media">, "media_id" | "caption">;
export type GalleryAsset = Pick<
  Row<"media_assets">,
  | "id"
  | "bucket"
  | "object_path"
  | "alt_text"
  | "mime_type"
  | "width"
  | "height"
>;
export function galleryImages(entries: GalleryEntry[], assets: GalleryAsset[]) {
  const config = getSupabaseConfig();
  if (!config) return [];
  return entries.flatMap((item) => {
    const asset = assets.find(
      (asset) =>
        asset.id === item.media_id &&
        asset.bucket === "portfolio-public" &&
        asset.mime_type.startsWith("image/"),
    );
    if (!asset) return [];
    return [
      publicGalleryImageSchema.parse({
        src: `${config.url}/storage/v1/object/public/portfolio-public/${asset.object_path}`,
        alt: asset.alt_text || item.caption,
        caption: item.caption,
        width: asset.width ?? 1200,
        height: asset.height ?? 800,
      }),
    ];
  });
}
