import test from "node:test";
import assert from "node:assert/strict";
import {
  projectInputSchema,
  settingsInputSchema,
  recordVersion,
} from "../../lib/validations/admin-content";
const project = {
  title: "Test",
  slug: "test",
  summary: "Summary",
  details: "<script>alert(1)</script>",
  category: "Web",
  technologies: ["TypeScript", "TypeScript"],
  cover_image: "",
  cover_alt: "",
  repository_url: "",
  demo_url: "",
  download_url: "",
  featured: false,
  sort_order: 0,
  status: "draft",
  seo_title: "",
  seo_description: "",
};
test("admin schemas bound fields, reject privileged extras/unsafe URLs and require publishing summary", () => {
  assert.equal(
    projectInputSchema.safeParse({ ...project, is_admin: true }).success,
    false,
  );
  assert.equal(
    projectInputSchema.safeParse({
      ...project,
      repository_url: "javascript:alert(1)",
    }).success,
    false,
  );
  assert.equal(
    projectInputSchema.safeParse({
      ...project,
      status: "published",
      summary: "",
    }).success,
    false,
  );
  assert.equal(
    projectInputSchema.safeParse({ ...project, slug: "../admin" }).success,
    false,
  );
  assert.equal(
    projectInputSchema.safeParse({ ...project, sort_order: NaN }).success,
    false,
  );
  assert.equal(
    projectInputSchema.safeParse({ ...project, sort_order: 10001 }).success,
    false,
  );
  assert.equal(
    projectInputSchema.safeParse({
      ...project,
      cover_image: "/assets/img/profile.png",
      cover_alt: "",
    }).success,
    false,
  );
  assert.deepEqual(projectInputSchema.parse(project).technologies, [
    "TypeScript",
  ]);
  assert.equal(
    projectInputSchema.parse(project).details,
    "<script>alert(1)</script>",
  );
  assert.equal(
    settingsInputSchema.safeParse({ name: "X", role: "admin" }).success,
    false,
  );
  assert.equal(recordVersion.safeParse("not-a-date").success, false);
});
