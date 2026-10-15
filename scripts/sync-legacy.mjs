import { cp, lstat, rename } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

export async function syncPublicAssets(source, destination) {
  await cp(path.join(source, "assets"), path.join(destination, "assets"), {
    recursive: true,
    filter: (file) => !file.endsWith(".DS_Store"),
  });
  await cp(
    path.join(source, "favicon.ico"),
    path.join(destination, "favicon.ico"),
  );
  const legacy = path.join(destination, "legacy");
  if (
    await lstat(legacy).catch((error) => {
      if (error.code !== "ENOENT") throw error;
      return null;
    })
  ) {
    const backup = path.join(source, ".legacy-preview");
    if (
      await lstat(backup).catch((error) => {
        if (error.code !== "ENOENT") throw error;
        return null;
      })
    )
      throw new Error(
        "Legacy preview archive already exists. Preserve/review both folders before proceeding.",
      );
    // Retire served HTML without discarding edits to an old generated preview.
    await rename(legacy, backup);
  }
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  await syncPublicAssets(process.cwd(), path.resolve("public"));
  console.log(
    "Original source preserved; public assets synchronized. Legacy HTML is not served.",
  );
}
