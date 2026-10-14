import type { Metadata } from "next";
import "@fontsource-variable/dm-sans";
import "@fontsource-variable/source-serif-4";
import "./globals.css";
export const metadata: Metadata = {
  title: {
    default: "Farzine Hossen — Portfolio",
    template: "%s — Farzine Hossen",
  },
  description:
    "Software development and artificial intelligence. Explore the work and profile of Farzine Hossen.",
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
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
