import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import {
  collectionInputSchema,
  collectionKind,
} from "../../lib/validations/admin-collections";
import { collections } from "../../lib/admin/collections";
for (const kind of collectionKind.options) {
  const value: Record<string, unknown> = { ...collections[kind].defaults };
  for (const field of collections[kind].fields) {
    if (field.kind === "text" || field.kind === "textarea")
      value[field.name] = "Test content";
    if (field.kind === "url") value[field.name] = "https://example.test/";
    if (field.kind === "lines") value[field.name] = ["Literal <script> text"];
  }
  for (const field of collections[kind].fields)
    if (field.name.endsWith("_id")) value[field.name] = randomUUID();
  if (kind === "navigation_items") value.url = "/projects";
  const input = { kind, value };
  assert.equal(collectionInputSchema.safeParse(input).success, true, kind);
  assert.equal(
    collectionInputSchema.safeParse({
      ...input,
      value: { ...value, user_id: randomUUID() },
    }).success,
    false,
  );
  assert.equal(
    collectionInputSchema.safeParse({
      ...input,
      value: { ...value, sort_order: -1 },
    }).success,
    false,
  );
  if ("url" in value)
    assert.equal(
      collectionInputSchema.safeParse({
        ...input,
        value: { ...value, url: "javascript:alert(1)" },
      }).success,
      false,
    );
  if ("status" in value)
    assert.equal(
      collectionInputSchema.safeParse({
        ...input,
        value: { ...value, status: "private" },
      }).success,
      false,
    );
}
assert.equal(
  collectionInputSchema.safeParse({ kind: "admin_profiles", value: {} })
    .success,
  false,
);
assert.equal(
  collectionInputSchema.safeParse({
    kind: "profile_facts",
    value: {
      ...collections.profile_facts.defaults,
      label: "Email",
      value: "invalid",
      kind: "email",
    },
  }).success,
  false,
);
assert.equal(
  collectionInputSchema.safeParse({
    kind: "social_links",
    value: {
      ...collections.social_links.defaults,
      label: "Site",
      url: "https://example.test",
      icon: "__proto__",
    },
  }).success,
  false,
);
assert.equal(
  collectionInputSchema.safeParse({
    kind: "experiences",
    value: {
      ...collections.experiences.defaults,
      organization: "Test",
      role: "Test",
      bullets: Array(31).fill("Bullet"),
    },
  }).success,
  false,
);
assert.equal(collections.profile_facts.defaults.is_public, false);
