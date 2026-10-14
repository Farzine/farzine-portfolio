import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
export async function createTestDatabase() {
  const db = new PGlite();
  await db.exec(readFileSync("supabase/tests/platform.sql", "utf8"));
  await db.exec(
    readFileSync("supabase/migrations/202610140001_portfolio.sql", "utf8"),
  );
  return db;
}
