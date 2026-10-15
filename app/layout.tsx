import "@fontsource-variable/open-sans/wght.css";
import "@fontsource-variable/raleway/wght.css";
import "@fontsource/poppins/latin-400.css";
import "@fontsource/poppins/latin-500.css";
import "@fontsource/poppins/latin-700.css";
import type { Metadata } from "next";
import { legacyHome } from "@/lib/legacy-home";
import "./globals.css";

export const metadata: Metadata = {
  title: legacyHome.title,
  description: legacyHome.description,
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-theme="dark">
      <head>
        <link
          rel="stylesheet"
          href="/assets/vendor/boxicons/css/boxicons.min.css"
        />
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
