import assert from "node:assert/strict";
import test from "node:test";
import sharp from "sharp";
import {
  collectionSchemas,
  collectionNameSchema,
  collectionId,
} from "../../lib/validations/collections";
import { validateUpload, uploadLimit } from "../../lib/validations/upload";
import { hasSameOrigin } from "../../lib/security/origin";

test("upload origin validation handles the listener host without trusting a foreign origin", () => {
  const request = (origin: string, host = "127.0.0.1:3102") =>
    new Request("http://localhost:3102/admin/media/upload", {
      headers: { origin, host },
    });
  assert.equal(hasSameOrigin(request("http://127.0.0.1:3102")), true);
  for (const origin of [
    "null",
    "https://attacker.invalid",
    "http://127.0.0.1:3103",
    "http://127.0.0.1:3102/path",
    "http://127.0.0.1:3102?x=1",
  ])
    assert.equal(hasSameOrigin(request(origin)), false);
  assert.equal(hasSameOrigin(new Request("http://localhost:3102")), false);
});
test("collection schemas constrain privacy, ordering, stable keys, icons and URLs", () => {
  const fact = {
    label: "Test fact",
    value: "Private test data",
    placement: "about",
    icon: "info",
    sort_order: "0",
    is_visible: "",
  };
  assert.equal(collectionSchemas.profile_facts.parse(fact).is_visible, false);
  assert.equal(
    collectionSchemas.profile_facts.parse({ ...fact, is_visible: "on" })
      .is_visible,
    true,
  );
  for (const invalid of [
    { icon: "<svg>" },
    { placement: "private-table" },
    { sort_order: "-1" },
    { is_visible: "true" },
  ])
    assert.equal(
      collectionSchemas.profile_facts.safeParse({ ...fact, ...invalid })
        .success,
      false,
    );
  assert.equal(collectionNameSchema.safeParse("admin_users").success, false);
  assert.equal(
    collectionId("section_settings").safeParse("contacts").success,
    true,
  );
  assert.equal(
    collectionId("public_labels").safeParse("openProject").success,
    true,
  );
  assert.equal(
    collectionId("public_labels").safeParse("arbitrary-html").success,
    false,
  );
  assert.equal(
    collectionSchemas.social_links.safeParse({
      label: "Bad",
      url: "javascript:alert(1)",
      icon: "github",
      placement: "hero",
      sort_order: "0",
      is_visible: "on",
    }).success,
    false,
  );
  assert.equal(
    collectionSchemas.document_links.safeParse({
      title: "Resume",
      description: "",
      url: "",
      media_id: "",
      sort_order: "0",
      is_visible: "",
    }).success,
    false,
  );
});
test("image uploads decode pixels, strip metadata, resize, and reject spoofed/oversize/active files", async () => {
  const image = await sharp({
    create: { width: 2600, height: 100, channels: 3, background: "#09203a" },
  })
    .withMetadata()
    .png()
    .toBuffer();
  const result = await validateUpload(
    new File([image], "photo.png", { type: "image/png" }),
  );
  assert.equal(result.mime, "image/webp");
  assert.equal(result.width, 2400);
  const metadata = await sharp(result.bytes).metadata();
  assert.equal(metadata.exif, undefined);
  for (const [name, type, bytes] of [
    ["evil.svg", "image/svg+xml", "<svg><script/></svg>"],
    ["spoof.png", "image/png", "<svg/>"],
    ["bad.pdf", "application/pdf", "%PDF-1.7 truncated"],
    ["wrong.jpg", "image/jpeg", image],
  ] as const)
    await assert.rejects(validateUpload(new File([bytes], name, { type })));
  await assert.rejects(
    validateUpload(
      new File([new Uint8Array(uploadLimit + 1)], "huge.png", {
        type: "image/png",
      }),
    ),
  );
  const pdf = await validateUpload(
    new File(
      ["%PDF-1.7\n1 0 obj\n<< /Type /Catalog >>\nendobj\n%%EOF\n"],
      "resume.pdf",
      { type: "application/pdf" },
    ),
  );
  assert.equal(pdf.kind, "document");
});
