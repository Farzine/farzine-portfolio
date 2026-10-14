import test from "node:test";
import assert from "node:assert/strict";
import seed from "../../data/portfolio-seed.json";
import {
  publicProjectSchema,
  publicProfileSchema,
  publicFactSchema,
  publicSectionSchema,
  webUrl,
  navigationUrl,
  safeImageSource,
} from "../../lib/validations/public-content";
test("public project/profile DTOs reject drafts and strip private/operational fields", () => {
  const source = seed.projects[0];
  assert.equal(publicProjectSchema.safeParse(source).success, false);
  const publicRow = publicProjectSchema.parse({
    ...source,
    status: "published",
    private_note: "private",
    contact_email: "private",
    created_at: "private",
  });
  for (const field of [
    "id",
    "status",
    "sort_order",
    "created_at",
    "private_note",
    "contact_email",
  ])
    assert.equal(field in publicRow, false, field);
  assert.equal(publicRow.slug, "gsa-sust");
  assert.equal(
    publicProfileSchema.safeParse(seed.site_settings[0]).success,
    false,
  );
  assert.equal(
    publicProjectSchema.safeParse({ ...source, status: "archived" }).success,
    false,
  );
  assert.equal(
    publicFactSchema.safeParse(seed.profile_facts[0]).success,
    false,
  );
  assert.equal(
    publicSectionSchema.safeParse({
      ...seed.section_settings[0],
      status: "published",
      visible: false,
    }).success,
    false,
  );
});
test("unsafe URL schemes, credentials, malformed slugs and untrusted image origins are rejected", () => {
  for (const value of [
    "javascript:alert(1)",
    "data:text/html,x",
    "file:///etc/passwd",
    "https://user:password@example.com",
    "//example.com",
    "https://example.com/ a",
  ])
    assert.equal(webUrl.safeParse(value).success, false, value);
  assert.equal(webUrl.safeParse("https://github.com/Farzine").success, true);
  assert.equal(navigationUrl.safeParse("/#contact").success, true);
  assert.equal(navigationUrl.safeParse("/admin").success, false);
  for (const source of [
    "/assets/img/../secret.png",
    "//evil.com/a.png",
    "/assets/img/x.svg",
    "https://evil.com/x.png",
    "/assets/img/%2e%2e/x.png",
  ])
    assert.equal(safeImageSource(source, "https://test.supabase.co"), "");
  assert.equal(
    safeImageSource("/assets/img/certification/Game of Datathon.jpg"),
    "/assets/img/certification/Game of Datathon.jpg",
  );
  assert.equal(
    publicProjectSchema.safeParse({
      ...seed.projects[0],
      status: "published",
      slug: "../private",
    }).success,
    false,
  );
});
