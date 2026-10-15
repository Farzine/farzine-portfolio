import {
  isPublicSupabaseKey,
  supabaseOrigin,
} from "./lib/security/environment";
import type { NextConfig } from "next";
import projectRedirects from "./data/project-redirects.json";
const publicKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
if (publicKey && !isPublicSupabaseKey(publicKey))
  throw new Error(
    "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY must be a publishable/anon key. Refusing to bundle another key type.",
  );
if (process.env.NEXT_PUBLIC_SUPABASE_URL)
  supabaseOrigin(process.env.NEXT_PUBLIC_SUPABASE_URL);
const config: NextConfig = {
  poweredByHeader: false,
  experimental: { serverActions: { bodySizeLimit: "4mb" } },
  images: {
    dangerouslyAllowLocalIP:
      process.env.NODE_ENV === "development" &&
      Boolean(
        process.env.NEXT_PUBLIC_SUPABASE_URL &&
        ["localhost", "127.0.0.1", "[::1]"].includes(
          new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname,
        ),
      ),
    remotePatterns: process.env.NEXT_PUBLIC_SUPABASE_URL
      ? [
          {
            protocol:
              new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).protocol ===
              "https:"
                ? "https"
                : "http",
            hostname: new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname,
            port: new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).port,
            pathname: "/storage/v1/object/public/portfolio-public/**",
          },
        ]
      : [],
  },
  reactStrictMode: true,
  async redirects() {
    return [
      { source: "/index.html", destination: "/", permanent: true },
      ...projectRedirects,
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          ...(process.env.NODE_ENV === "production"
            ? [{ key: "Strict-Transport-Security", value: "max-age=31536000" }]
            : []),
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};
export default config;
