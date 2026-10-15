import { PGlite } from "@electric-sql/pglite";
import { readFileSync, readdirSync } from "node:fs";
export async function createTestDatabase() {
  const db = new PGlite();
  await db.exec(readFileSync("supabase/tests/platform.sql", "utf8"));
  for (const file of readdirSync("supabase/migrations")
    .filter((name) => name.endsWith(".sql"))
    .sort())
    await db.exec(readFileSync(`supabase/migrations/${file}`, "utf8"));
  return db;
}
