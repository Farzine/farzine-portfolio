import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { readSupabaseConfig } from "@/lib/security/runtime-config";
import type { Database } from "@/lib/types/database";

export async function createSessionClient({ writeCookies = false } = {}) {
  const config = readSupabaseConfig();
  const store = await cookies();
  return createServerClient<Database>(config.url, config.key, {
    cookieOptions: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    },
    cookies: {
      getAll: () => store.getAll(),
      setAll: (values) => {
        // Server Component reads cannot set cookies; Proxy refreshes before rendering.
        if (!writeCookies) return;
        for (const { name, value, options } of values)
          store.set(name, value, options);
      },
    },
  });
}
