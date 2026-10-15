import { connection } from "next/server";
import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/security/metadata";
export default async function robots(): Promise<MetadataRoute.Robots> {
  await connection();
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/auth", "/api/"],
    },
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
