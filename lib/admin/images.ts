import "server-only";
import inventory from "@/data/legacy-inventory.json";
import { ContentError } from "./errors";
export function getLegacyImages(): string[] {
  return inventory.assets
    .filter(
      (asset) =>
        asset.path.startsWith("assets/img/") &&
        /\.(png|jpe?g|webp|avif)$/i.test(asset.path),
    )
    .map((asset) => `/${asset.path}`)
    .sort();
}
export function validateLegacyImage(path: string) {
  if (path && !getLegacyImages().includes(path))
    throw new ContentError(
      "Select an existing portfolio image. Uploads will be available in the media workflow.",
    );
}
