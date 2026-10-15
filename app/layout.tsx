import { getPublicIdentity } from "@/lib/dal/public";
import { publicPageMetadata, siteOrigin } from "@/lib/security/metadata";
import { headers } from "next/headers";
import type { Metadata, Viewport } from "next";
import "@fontsource-variable/dm-sans";
import "@fontsource-variable/source-serif-4";
import "./globals.css";
export const viewport: Viewport = {
  themeColor: "#101715",
  colorScheme: "dark",
};
export async function generateMetadata(): Promise<Metadata> {
  const profile = await getPublicIdentity();
  const name = profile?.name || "Portfolio";
  const metadata = publicPageMetadata(
    profile,
    "/",
    profile?.seo_title || name,
    profile?.seo_description ||
      profile?.summary ||
      "Portfolio content awaiting publication.",
  );
  const origin = siteOrigin();
  return {
    ...metadata,
    title: { default: profile?.seo_title || name, template: `%s — ${name}` },
    metadataBase: origin ? new URL(origin) : undefined,
    icons: { icon: profile?.favicon_image || "/favicon.ico" },
    robots: profile
      ? { index: true, follow: true }
      : { index: false, follow: false },
  };
}
export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  await headers();
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
