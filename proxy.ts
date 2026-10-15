import { randomBytes } from "node:crypto";
import { contentSecurityPolicy } from "@/lib/security/headers";
import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { readSupabaseConfig } from "@/lib/security/runtime-config";
import type { Database } from "@/lib/types/database";

export async function proxy(request: NextRequest) {
  const privateRoute = /^\/(admin|auth)(?:\/|$)/.test(request.nextUrl.pathname);
  const nonce = randomBytes(18).toString("base64");
  const secureTransport =
    request.nextUrl.protocol === "https:" ||
    request.headers.get("x-forwarded-proto") === "https";
  const policy = contentSecurityPolicy(nonce, {
    development: process.env.NODE_ENV === "development",
    secureTransport,
    storageUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  });
  function next() {
    const headers = new Headers(request.headers);
    // Overwrite incoming values; a visitor cannot choose a trusted nonce/policy.
    headers.set("x-nonce", nonce);
    headers.set("Content-Security-Policy", policy);
    const result = NextResponse.next({ request: { headers } });
    result.headers.set(
      "Content-Security-Policy",
      /\/admin\/media\/[^/]+\/file$/.test(request.nextUrl.pathname)
        ? "sandbox; default-src 'none'; base-uri 'none'; frame-ancestors 'none'"
        : policy,
    );
    result.headers.set("Cache-Control", "private, no-store, max-age=0");
    if (privateRoute) result.headers.set("X-Robots-Tag", "noindex, nofollow");
    if (secureTransport)
      result.headers.set("Strict-Transport-Security", "max-age=31536000");
    return result;
  }
  let response = next();
  if (!privateRoute) return response;
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
        response = next();
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

export const config = {
  matcher: ["/((?!_next/static|_next/image|assets/|favicon.ico).*)"],
};
