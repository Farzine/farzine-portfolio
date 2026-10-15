import { cp, mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Preserve originals; generated public copies make migration reversible.
export async function syncLegacy(source, destination) {
  await mkdir(path.join(destination, "legacy/projects"), { recursive: true });
  await cp(path.join(source, "assets"), path.join(destination, "assets"), {
    recursive: true,
    filter: (file) => !file.endsWith(".DS_Store"),
  });
  await cp(
    path.join(source, "favicon.ico"),
    path.join(destination, "favicon.ico"),
  );
  for (const file of [
    "index.html",
    ...(await readdir(path.join(source, "projects")))
      .filter((name) => name.endsWith(".html"))
      .map((name) => `projects/${name}`),
  ]) {
    const html = await readFile(path.join(source, file), "utf8");
    await writeFile(
      path.join(destination, "legacy", file),
      html.replace(/(src|href)="(?:\.\.\/)?assets\//g, '$1="/assets/'),
    );
  }
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  await syncLegacy(process.cwd(), path.resolve("public"));
  console.log(
    "Legacy source and assets preserved; public preview synchronized.",
  );
}
