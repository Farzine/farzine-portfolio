import "server-only";
import { createClient } from "@supabase/supabase-js";
import { readSupabaseConfig } from "@/lib/security/runtime-config";
import type { Database } from "@/lib/types/database";

// Never attach session cookies to a shared/public read.
export function createPublicClient() {
  const config = readSupabaseConfig();
  return createClient<Database>(config.url, config.key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}
