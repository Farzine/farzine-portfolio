import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import seed from "../../data/legacy-seed.json";

const clean = (value: string) => value.replace(/\s+/g, " ").trim();

test("every project, skill group and legacy image has a seed mapping; imports stay unpublished", async () => {
  const inventory = JSON.parse(
    await readFile("docs/legacy-inventory.json", "utf8"),
  ) as {
    files: Record<string, { records: { text?: string }[] }>;
  };
  const projects = seed.records.projects;
  assert.equal(projects.length, 15);
  assert.equal(new Set(projects.map((project) => project.slug)).size, 15);
  assert.equal(seed.records.media_assets.length, 28);
  assert.equal(seed.records.skills.length, 36);
  assert.equal(seed.records.section_settings.length, 11);
  assert.equal(seed.records.document_links.length, 2);
  assert.equal(seed.records.interests.length, 8);
  for (const project of projects) {
    assert.equal(project.status, "draft");
    const provenance = seed.provenance.find(
      (item) => item.record_id === project.id,
    );
    assert.ok(provenance);
    const legacy = inventory.files[provenance.source_file].records
      .map((item) => item.text || "")
      .join(" ");
    for (const paragraph of project.paragraphs)
      assert.ok(
        clean(legacy).includes(clean(paragraph)),
        `Exact paragraph preservation: ${project.slug}`,
      );
    assert.ok(
      seed.records.media_assets.some(
        (media) => media.id === project.cover_media_id,
      ),
    );
  }
  assert.ok(seed.records.profile_facts.every((fact) => !fact.is_visible));
  assert.ok(seed.records.experiences.every((entry) => !entry.is_visible));
  assert.ok(
    seed.records.media_assets.every(
      (entry) => !entry.legacy_path.includes(".."),
    ),
  );
});
