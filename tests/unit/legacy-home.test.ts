import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { legacyHome } from "../../lib/legacy-home";

test("foundation snapshot preserves actual legacy identity, roles and section references", async () => {
  const source = await readFile("index.html", "utf8");
  assert.ok(source.includes(legacyHome.name));
  assert.ok(source.includes(legacyHome.role));
  assert.ok(source.includes(legacyHome.updated));
  assert.equal(legacyHome.navigation.length, 8);
  for (const item of legacyHome.navigation) {
    const hash = item.href.split("#")[1];
    if (hash) assert.ok(source.includes(`id="${hash}"`));
  }
});
