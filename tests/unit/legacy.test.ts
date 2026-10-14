import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, join } from "node:path";
import inventory from "../../data/legacy-inventory.json";
test("all legacy source hashes and local image references remain intact", () => {
  assert.equal(inventory.files.length, 16);
  for (const file of inventory.files) {
    assert.equal(
      createHash("sha256").update(readFileSync(file.source)).digest("hex"),
      file.sha256,
      file.source,
    );
    for (const image of file.images)
      if (!image.src.startsWith("http"))
        assert.ok(existsSync(join(dirname(file.source), image.src)), image.src);
  }
});
