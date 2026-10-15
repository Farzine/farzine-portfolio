import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./admin.css";
import { ThemeToggle } from "@/components/site/theme-toggle";

export const metadata: Metadata = {
  title: "Portfolio administration",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";
export default function AdminRoot({ children }: { children: ReactNode }) {
  return (
    <>
      <div className="admin-root">{children}</div>
      <ThemeToggle />
    </>
  );
}
