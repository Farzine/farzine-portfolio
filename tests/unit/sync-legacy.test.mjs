import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { syncPublicAssets } from "../../scripts/sync-legacy.mjs";

test("asset sync is repeatable and retires generated HTML without losing source or preview edits", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "farzine-legacy-test-"));
  try {
    const source = path.join(root, "source");
    const destination = path.join(root, "public");
    await mkdir(path.join(source, "assets"), { recursive: true });
    await mkdir(path.join(destination, "legacy"), { recursive: true });
    const home = '<img src="assets/profile.png">';
    await writeFile(path.join(source, "index.html"), home);
    await writeFile(path.join(source, "favicon.ico"), "icon");
    await writeFile(path.join(source, "assets/profile.png"), "image");
    await writeFile(path.join(source, "assets/.DS_Store"), "metadata");
    await writeFile(
      path.join(destination, "legacy/index.html"),
      "saved preview edits",
    );
    await syncPublicAssets(source, destination);
    await syncPublicAssets(source, destination);
    assert.equal(await readFile(path.join(source, "index.html"), "utf8"), home);
    assert.equal(
      await readFile(path.join(source, ".legacy-preview/index.html"), "utf8"),
      "saved preview edits",
    );
    assert.equal(
      await readFile(path.join(destination, "assets/profile.png"), "utf8"),
      "image",
    );
    await assert.rejects(
      readFile(path.join(destination, "legacy/index.html")),
      { code: "ENOENT" },
    );
    await assert.rejects(readFile(path.join(destination, "assets/.DS_Store")), {
      code: "ENOENT",
    });
    await mkdir(path.join(destination, "legacy"));
    await writeFile(
      path.join(destination, "legacy/index.html"),
      "second edits",
    );
    await assert.rejects(
      syncPublicAssets(source, destination),
      /archive already exists/,
    );
    assert.equal(
      await readFile(path.join(destination, "legacy/index.html"), "utf8"),
      "second edits",
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
