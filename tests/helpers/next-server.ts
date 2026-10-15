import { spawn, type SpawnOptions } from "node:child_process";
import {
  cpSync,
  mkdtempSync,
  symlinkSync,
  rmSync,
  mkdirSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
export function createNextSnapshot(
  port: number,
  env: Record<string, string>,
  testCacheReset = false,
) {
  const source = process.cwd();
  const directory = mkdtempSync(join(tmpdir(), "farzine-next-test-"));
  for (const path of [
    "app",
    "components",
    "lib",
    "data",
    "public",
    "package.json",
    "tsconfig.json",
    "next-env.d.ts",
    "next.config.ts",
    "proxy.ts",
  ])
    cpSync(join(source, path), join(directory, path), { recursive: true });
  // This endpoint exists only inside the disposable fixture snapshot, never the real app.
  if (testCacheReset) {
    mkdirSync(join(directory, "app/test-cache-reset"), { recursive: true });
    writeFileSync(
      join(directory, "app/test-cache-reset/route.ts"),
      `import {revalidateTag} from 'next/cache';import {publicContentTables,contentTag} from '@/lib/cache/content-tags';export async function POST(){for(const table of publicContentTables)revalidateTag(contentTag(table),{expire:0});return Response.json({ok:true});}`,
    );
  }
  symlinkSync(
    join(source, "node_modules"),
    join(directory, "node_modules"),
    "dir",
  );
  const options: SpawnOptions = {
    cwd: directory,
    stdio: "inherit",
    env: {
      ...process.env,
      NEXT_PUBLIC_SUPABASE_URL: "",
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "",
      SUPABASE_SECRET_KEY: "",
      SITE_URL: `http://127.0.0.1:${port}`,
      ...env,
    },
  };
  return {
    directory,
    cli: join(source, "node_modules/next/dist/bin/next"),
    options,
    remove: () => rmSync(directory, { recursive: true, force: true }),
  };
}
export function startIsolatedNext(port: number, env: Record<string, string>) {
  const snapshot = createNextSnapshot(
    port,
    { ...env, NODE_ENV: "development" },
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY === "sb_publishable_test-only",
  );
  const child = spawn(
    process.execPath,
    [
      snapshot.cli,
      "dev",
      "--webpack",
      "--hostname",
      "127.0.0.1",
      "--port",
      String(port),
    ],
    snapshot.options,
  );
  child.once("exit", snapshot.remove);
  return child;
}
