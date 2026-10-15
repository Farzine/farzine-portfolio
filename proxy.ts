import { contentSecurityPolicy } from "@/lib/security/csp";
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseConfig } from "@/lib/supabase/config";
import type { Database } from "@/lib/types/database.generated";
export async function proxy(request: NextRequest) {
  const nonce = Buffer.from(
    crypto.getRandomValues(new Uint8Array(16)),
  ).toString("base64");
  const mediaOrigin = process.env.NEXT_PUBLIC_SUPABASE_URL
    ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).origin
    : undefined;
  const policy = contentSecurityPolicy(
    nonce,
    process.env.NODE_ENV !== "production",
    mediaOrigin,
  );
  const next = () => {
    const forwarded = new Headers(request.headers);
    forwarded.set("x-nonce", nonce);
    forwarded.set("Content-Security-Policy", policy);
    return NextResponse.next({ request: { headers: forwarded } });
  };
  let response = next();
  const privateRoute =
    request.nextUrl.pathname.startsWith("/admin") ||
    request.nextUrl.pathname.startsWith("/auth");
  const config = getSupabaseConfig();
  if (config && privateRoute) {
    const supabase = createServerClient<Database>(config.url, config.key, {
      cookieOptions: {
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
      },
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(values, cacheHeaders) {
          for (const { name, value } of values)
            request.cookies.set(name, value);
          response = next();
          for (const { name, value, options } of values)
            response.cookies.set(name, value, options);
          for (const [name, value] of Object.entries(cacheHeaders))
            response.headers.set(name, value);
        },
      },
    });
    await supabase.auth.getClaims();
  }
  response.headers.set("Content-Security-Policy", policy);
  if (privateRoute) {
    response.headers.set(
      "Cache-Control",
      "private, no-cache, no-store, must-revalidate, max-age=0",
    );
    response.headers.set("Expires", "0");
    response.headers.set("Pragma", "no-cache");
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
  }
  return response;
}
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|assets/|robots.txt|sitemap.xml).*)",
  ],
};
