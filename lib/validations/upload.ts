import { z } from "zod";
import sharp from "sharp";
export class UploadValidationError extends Error {}
export const MAX_UPLOAD_BYTES = 3 * 1024 * 1024;
export const uploadDetails = z
  .object({
    alt_text: z.string().trim().min(1, "Describe this asset.").max(400),
    is_public: z.boolean(),
  })
  .strict();
const formats: Record<string, { extension: RegExp; format: string }> = {
  "image/png": { extension: /\.png$/i, format: "png" },
  "image/jpeg": { extension: /\.jpe?g$/i, format: "jpeg" },
  "image/webp": { extension: /\.webp$/i, format: "webp" },
  "application/pdf": { extension: /\.pdf$/i, format: "pdf" },
};
export async function prepareUpload(file: File) {
  if (!file.size || file.size > MAX_UPLOAD_BYTES)
    throw new UploadValidationError("Choose a file between 1 byte and 3 MiB.");
  const expected = formats[file.type];
  if (!expected?.extension.test(file.name))
    throw new UploadValidationError(
      "Choose a PNG, JPEG, WebP or PDF with a matching file extension.",
    );
  const bytes = Buffer.from(await file.arrayBuffer());
  if (expected.format === "pdf") {
    if (
      !/^%PDF-(1\.[0-7]|2\.0)/.test(bytes.subarray(0, 16).toString("ascii")) ||
      !bytes.subarray(-1024).includes(Buffer.from("%%EOF"))
    )
      throw new UploadValidationError("The file is not a supported PDF.");
    return {
      bytes,
      mime_type: "application/pdf",
      extension: "pdf",
      width: null,
      height: null,
    };
  }
  const image = sharp(bytes, {
    limitInputPixels: 16000000,
    failOn: "warning",
  }).timeout({ seconds: 10 });
  const metadata = await image.metadata();
  if (
    metadata.format !== expected.format ||
    !metadata.width ||
    !metadata.height ||
    metadata.width > 6000 ||
    metadata.height > 6000 ||
    (metadata.pages ?? 1) > 1
  )
    throw new UploadValidationError(
      "Choose a still raster image up to 16 megapixels and 6000 pixels per side.",
    );
  const { data, info } = await image
    .rotate()
    .resize({
      width: 2048,
      height: 2048,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: 82 })
    .toBuffer({ resolveWithObject: true });
  if (data.length > MAX_UPLOAD_BYTES)
    throw new UploadValidationError(
      "The processed image is too large. Try a smaller image.",
    );
  return {
    bytes: data,
    mime_type: "image/webp",
    extension: "webp",
    width: info.width,
    height: info.height,
  };
}
