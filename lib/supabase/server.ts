import { publicReadTags } from "@/lib/cache/content-tags";
import "server-only";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { getSupabaseConfig } from "./config";
import type { Database } from "@/lib/types/database.generated";
export async function createSessionClient({ writable = false } = {}) {
  const config = getSupabaseConfig();
  if (!config) throw new Error("Supabase is not configured.");
  const cookieStore = await cookies();
  return createServerClient<Database>(config.url, config.key, {
    global: {
      fetch: (input, init) =>
        fetch(input, {
          ...init,
          cache: "no-store",
          signal: init?.signal
            ? AbortSignal.any([init.signal, AbortSignal.timeout(10000)])
            : AbortSignal.timeout(10000),
        }),
    },
    cookieOptions: {
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    },
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(values) {
        // Server Components are read-only; proxy refreshes their session cookies.
        if (writable)
          for (const { name, value, options } of values)
            cookieStore.set(name, value, options);
      },
    },
  });
}
export function createPublicClient() {
  const config = getSupabaseConfig();
  if (!config) throw new Error("Supabase is not configured.");
  return createClient<Database>(config.url, config.key, {
    global: {
      fetch: (input, init) => {
        const url = input instanceof Request ? input.url : String(input);
        const tags = publicReadTags(
          url,
          new URL(config.url).origin,
          init?.method ?? (input instanceof Request ? input.method : "GET"),
        );
        const requestHeaders = new Headers(
          init?.headers ??
            (input instanceof Request ? input.headers : undefined),
        );
        const authorization = requestHeaders.get("authorization");
        const anonymous =
          !requestHeaders.has("cookie") &&
          (!authorization || authorization === `Bearer ${config.key}`);
        return tags.length && anonymous
          ? fetch(input, {
              ...init,
              cache: "force-cache",
              signal: init?.signal
                ? AbortSignal.any([init.signal, AbortSignal.timeout(10000)])
                : AbortSignal.timeout(10000),
              next: { revalidate: 3600, tags },
            })
          : fetch(input, {
              ...init,
              cache: "no-store",
              signal: init?.signal
                ? AbortSignal.any([init.signal, AbortSignal.timeout(10000)])
                : AbortSignal.timeout(10000),
            });
      },
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}
