import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import sharp from "sharp";
import { prepareUpload, MAX_UPLOAD_BYTES } from "../../lib/validations/upload";
const source = readFileSync("public/assets/img/project/gsa-sust.png");
const image = await prepareUpload(
  new File([source], "image.png", { type: "image/png" }),
);
assert.equal(image.mime_type, "image/webp");
assert.ok(image.width && image.width <= 2048);
assert.ok(image.height && image.height <= 2048);
const metadata = await sharp(image.bytes).metadata();
assert.equal(metadata.exif, undefined);
assert.equal(metadata.format, "webp");
for (const file of [
  new File(["<svg/>"], "image.svg", { type: "image/svg+xml" }),
  new File(["<html>"], "image.png", { type: "image/png" }),
  new File([source], "image.pdf", { type: "image/png" }),
  new File([source], "image.png", { type: "image/jpeg" }),
  new File([Buffer.alloc(MAX_UPLOAD_BYTES + 1)], "large.png", {
    type: "image/png",
  }),
  new File(["<html>"], "file.pdf", { type: "application/pdf" }),
])
  await assert.rejects(prepareUpload(file));
const pdf = await prepareUpload(
  new File(["%PDF-1.7\nFixture PDF\n%%EOF"], "resume.pdf", {
    type: "application/pdf",
  }),
);
assert.equal(pdf.mime_type, "application/pdf");
