import "server-only";
import type { Database } from "@/lib/types/database";
import seed from "../../data/legacy-seed.json";

type Tables = Database["public"]["Tables"];
// Compile-time contract: imports must remain compatible with generated DB inserts.
const imported: {
  [Name in keyof typeof seed.records]: Tables[Name]["Insert"][];
} = seed.records;
export type LegacySeed = typeof imported;
