import assert from "node:assert/strict";
import test from "node:test";
import {
  settingsSchema,
  projectSchema,
  readFields,
  loginSchema,
} from "../../lib/validations/admin";

function formValues(schema: typeof projectSchema | typeof settingsSchema) {
  return Object.fromEntries(Object.keys(schema.shape).map((key) => [key, ""]));
}
test("project validation constrains status, slugs, URLs, lists, publication and privileged fields", () => {
  const valid = {
    ...formValues(projectSchema),
    title: "Source project",
    slug: "source-project",
    category: "Web",
    status: "draft",
    sort_order: "0",
  };
  const project = projectSchema.parse(valid);
  assert.equal(project.cover_media_id, null);
  assert.equal(project.featured, false);
  assert.equal(project.sort_order, 0);
  for (const patch of [
    { slug: "../escape" },
    { source_url: "javascript:alert(1)" },
    { demo_url: "https://user:password@example.com" },
    { status: "admin" },
    { status: "published" },
    { featured: "true" },
    { sort_order: "-1" },
    { sort_order: "1.5" },
    { published_at: "not-a-date" },
    { technologies: "a\n".repeat(101) },
    { paragraphs: "x".repeat(10001) },
  ])
    assert.equal(
      projectSchema.safeParse({ ...valid, ...patch }).success,
      false,
    );
  assert.equal(
    projectSchema.parse({
      ...valid,
      status: "published",
      published_at: "2026-01-01T00:00:00Z",
    }).status,
    "published",
  );
  const data = new FormData();
  for (const [key, value] of Object.entries(valid)) data.set(key, value);
  data.set("is_admin", "true");
  data.set("created_at", "forged");
  assert.ok(!("is_admin" in readFields(projectSchema, data)));
  assert.ok(
    !("created_at" in projectSchema.parse(readFields(projectSchema, data))),
  );
});
test("settings validate CTA pairs, sensitive URL schemes, media IDs and bounded roles", () => {
  const valid = {
    ...formValues(settingsSchema),
    display_name: "Farzine",
    full_name: "Farzine",
  };
  assert.equal(settingsSchema.parse(valid).profile_media_id, null);
  for (const patch of [
    { roles: "Role\n".repeat(11) },
    { profile_media_id: "../../file" },
    { primary_cta_label: "Email" },
    { canonical_url: "data:text/html,test" },
    {
      primary_cta_label: "Email",
      primary_cta_url: "mailto:a@example.com%0d%0aBcc:x@example.com",
    },
    { twitter_handle: "bad handle" },
  ])
    assert.equal(
      settingsSchema.safeParse({ ...valid, ...patch }).success,
      false,
    );
  assert.equal(
    settingsSchema.parse({
      ...valid,
      primary_cta_label: "Email",
      primary_cta_url: "mailto:owner@example.com",
    }).primary_cta_label,
    "Email",
  );
  assert.equal(
    loginSchema.safeParse({ email: "x", password: "" }).success,
    false,
  );
});
