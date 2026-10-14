import test from "node:test";
import assert from "node:assert/strict";
import seed from "../../data/portfolio-seed.json";
import provenance from "../../data/seed-provenance.json";
test("seed covers real legacy entities, keeps them draft and preserves uncertain values", () => {
  assert.equal(seed.projects.length, 15);
  assert.equal(seed.experiences.length, 4);
  assert.equal(seed.education.length, 3);
  assert.equal(seed.certifications.length, 9);
  assert.equal(seed.achievements.length, 5);
  assert.equal(seed.skill_groups.length, 4);
  assert.equal(seed.skills.length, 36);
  assert.equal(seed.interests.length, 8);
  for (const [table, rows] of Object.entries(seed)) {
    if (table === "profile_facts") {
      assert.ok(seed.profile_facts.every((r) => !r.is_public));
      continue;
    }
    for (const row of rows)
      assert.equal("status" in row ? row.status : null, "draft");
  }
  assert.equal(seed.education[0].date_label, "March 2022 - Present");
  assert.equal(seed.experiences[0].date_label, "Nov 2025 - Feb 2026");
  assert.equal(
    seed.projects.find((p) => p.slug === "dp-learning-app")?.cover_image,
    "/assets/img/project/vdg.jpg",
  );
  assert.equal(seed.certifications.filter((c) => !c.credential_url).length, 3);
  assert.equal(seed.site_settings[0].last_updated_label, "January 31, 2026");
  assert.equal(seed.site_settings[0].show_last_updated, false);
  assert.ok(
    provenance
      .filter((p) => p.table === "projects")
      .every((p) => p.source.startsWith("projects/")),
  );
});
