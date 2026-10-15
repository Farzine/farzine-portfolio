import Link from "next/link";
import { requireAdminPage } from "@/lib/auth/require-admin-page";
import { LogoutForm } from "@/components/admin/login-form";
export const metadata = {
  title: "Owner workspace",
  robots: { index: false, follow: false },
};
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdminPage();
  return (
    <>
      <header className="wrap admin-header">
        <Link className="identity" href="/admin">
          Owner workspace /
        </Link>
        <LogoutForm />
      </header>
      <div className="wrap admin-shell">
        <nav className="admin-nav" aria-label="Admin navigation">
          <Link href="/admin">Overview</Link>
          <Link href="/admin/projects">Projects</Link>
          <Link href="/admin/content">Content collections</Link>
          <Link href="/admin/media">Media library</Link>
          <Link href="/admin/messages">Contact messages</Link>
          <Link href="/admin/settings">Site settings</Link>
          <Link href="/">Public site ↗</Link>
        </nav>
        <main tabIndex={-1} id="main" className="admin-content">
          {children}
        </main>
      </div>
    </>
  );
}
