import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import seed from "../../data/legacy-seed.json";

test("migrated home seed preserves actual identity, roles and section references", async () => {
  const source = await readFile("index.html", "utf8");
  const home = seed.records.site_settings[0];
  assert.ok(source.includes(home.display_name));
  for (const role of home.roles) assert.ok(source.includes(role));
  assert.ok(source.includes(home.updated_display));
  assert.equal(seed.records.navigation_items.length, 8);
  for (const item of seed.records.navigation_items) {
    assert.ok(source.includes(`id="${item.section_key}"`));
  }
});
