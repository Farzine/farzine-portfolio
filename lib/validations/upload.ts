import sharp from "sharp";
import { z } from "zod";

export const uploadLimit = 10 * 1024 * 1024;
export const uploadMetadata = z.object({
  label: z.string().trim().min(1).max(200),
  alt_text: z.string().trim().max(500),
  visibility: z.enum(["private", "public"]),
});
export class UploadError extends Error {}
const formats = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  avif: "image/avif",
  pdf: "application/pdf",
};
export async function validateUpload(file: File) {
  if (!file.size || file.size > uploadLimit)
    throw new UploadError("Choose a file between 1 byte and 10 MiB.");
  const extension = file.name.split(".").pop()?.toLowerCase();
  const parsedExtension = z
    .enum(["png", "jpg", "jpeg", "webp", "avif", "pdf"])
    .safeParse(extension);
  if (!parsedExtension.success)
    throw new UploadError(
      "Use PNG, JPEG, WebP, AVIF or PDF. SVG and HTML are not accepted.",
    );
  const mime = formats[parsedExtension.data];
  if (file.type !== mime)
    throw new UploadError("The filename and reported file type must match.");
  const bytes = Buffer.from(await file.arrayBuffer());
  if (extension === "pdf") {
    if (
      !/^%PDF-1\.[0-7]|^%PDF-2\.0/.test(bytes.subarray(0, 8).toString()) ||
      !bytes.subarray(-1024).includes(Buffer.from("%%EOF"))
    )
      throw new UploadError("Choose a complete PDF document.");
    // PDF is a download, not an HTML preview. This is a format check, not PDF sanitization.
    return {
      bytes,
      extension: "pdf",
      mime: "application/pdf",
      kind: "document" as const,
      width: null,
      height: null,
    };
  }
  const signature = bytes.subarray(0, 12);
  const raster =
    signature
      .subarray(0, 8)
      .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) ||
    (signature[0] === 255 && signature[1] === 216 && signature[2] === 255) ||
    (signature.toString("ascii", 0, 4) === "RIFF" &&
      signature.toString("ascii", 8, 12) === "WEBP") ||
    signature.toString("ascii", 4, 8) === "ftyp";
  if (!raster)
    throw new UploadError("The file is not a supported raster image.");
  try {
    const image = sharp(bytes, {
      limitInputPixels: 24000000,
      failOn: "warning",
    });
    const metadata = await image.metadata();
    const actual =
      metadata.format === "jpeg"
        ? "image/jpeg"
        : metadata.format === "heif" && metadata.compression === "av1"
          ? "image/avif"
          : `image/${metadata.format}`;
    if (actual !== mime || (metadata.pages || 1) > 1)
      throw new UploadError(
        "Use a single-frame image matching its filename and type.",
      );
    const result = await image
      .rotate()
      .resize({
        width: 2400,
        height: 2400,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: 86 })
      .toBuffer({ resolveWithObject: true });
    if (result.data.length > uploadLimit)
      throw new UploadError("Processed image exceeds 10 MiB.");
    return {
      bytes: result.data,
      extension: "webp",
      mime: "image/webp",
      kind: "image" as const,
      width: result.info.width,
      height: result.info.height,
    };
  } catch (error) {
    if (error instanceof UploadError) throw error;
    throw new UploadError(
      "Unable to decode this image. Use a valid image up to 24 megapixels.",
    );
  }
}
