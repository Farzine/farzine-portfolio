import "@fontsource-variable/open-sans/wght.css";
import "@fontsource-variable/raleway/wght.css";
import "@fontsource/poppins/latin-400.css";
import "@fontsource/poppins/latin-500.css";
import "@fontsource/poppins/latin-700.css";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { themeBootstrap } from "@/lib/theme";
import "./globals.css";

export const metadata: Metadata = {
  icons: { icon: "/favicon.ico" },
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const nonce = (await headers()).get("x-nonce") || undefined;
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <head>
        <script id="theme-init" nonce={nonce}>
          {themeBootstrap}
        </script>
        <link
          rel="stylesheet"
          href="/assets/vendor/boxicons/css/boxicons.min.css"
        />
        <link rel="stylesheet" href="/assets/vendor/remixicon/remixicon.css" />
      </head>
      <body>
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
