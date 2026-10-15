import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { syncLegacy } from "../../scripts/sync-legacy.mjs";

test("legacy synchronization preserves sources and makes old asset URLs usable", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "farzine-legacy-test-"));
  try {
    const source = path.join(root, "source");
    const destination = path.join(root, "public");
    await mkdir(path.join(source, "assets"), { recursive: true });
    await mkdir(path.join(source, "projects"));
    const home =
      '<img src="assets/profile.png"><a href="projects/example.html">Details</a>';
    await writeFile(path.join(source, "index.html"), home);
    await writeFile(path.join(source, "favicon.ico"), "icon");
    await writeFile(path.join(source, "assets/profile.png"), "image");
    await writeFile(path.join(source, "assets/.DS_Store"), "metadata");
    await writeFile(
      path.join(source, "projects/example.html"),
      '<img src="../assets/profile.png">',
    );
    await syncLegacy(source, destination);
    await syncLegacy(source, destination);
    assert.equal(await readFile(path.join(source, "index.html"), "utf8"), home);
    assert.equal(
      await readFile(path.join(destination, "legacy/index.html"), "utf8"),
      home.replace('src="assets/', 'src="/assets/'),
    );
    assert.equal(
      await readFile(
        path.join(destination, "legacy/projects/example.html"),
        "utf8",
      ),
      '<img src="/assets/profile.png">',
    );
    assert.equal(
      await readFile(path.join(destination, "assets/profile.png"), "utf8"),
      "image",
    );
    await assert.rejects(readFile(path.join(destination, "assets/.DS_Store")), {
      code: "ENOENT",
    });
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
