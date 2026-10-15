import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { readSupabaseConfig } from "@/lib/security/runtime-config";
import type { Database } from "@/lib/types/database";

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  response.headers.set("Cache-Control", "private, no-store, max-age=0");
  response.headers.set("X-Robots-Tag", "noindex, nofollow");
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  )
    return response;
  const config = readSupabaseConfig();
  const supabase = createServerClient<Database>(config.url, config.key, {
    cookieOptions: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    },
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (values, headers) => {
        for (const { name, value } of values) request.cookies.set(name, value);
        const previousCookies = response.cookies.getAll();
        const previousHeaders = response.headers;
        response = NextResponse.next({ request });
        for (const cookie of previousCookies) response.cookies.set(cookie);
        for (const name of ["Cache-Control", "Expires", "Pragma"]) {
          const value = previousHeaders.get(name);
          if (value) response.headers.set(name, value);
        }
        for (const { name, value, options } of values)
          response.cookies.set(name, value, options);
        for (const [key, value] of Object.entries(headers))
          response.headers.set(key, value);
        response.headers.set("Cache-Control", "private, no-store, max-age=0");
        response.headers.set("X-Robots-Tag", "noindex, nofollow");
      },
    },
  });
  await supabase.auth.getClaims();
  return response;
}

export const config = { matcher: ["/admin/:path*", "/auth/:path*"] };
