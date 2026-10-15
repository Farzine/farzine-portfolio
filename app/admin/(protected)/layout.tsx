import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { logoutAction } from "@/app/admin/actions";
import { EditorForm } from "@/components/admin/editor-form";
import { AuthorizationError } from "@/lib/auth/errors";
import { requireAdmin } from "@/lib/auth/require-admin";

export default async function ProtectedLayout({
  children,
}: {
  children: ReactNode;
}) {
  try {
    await requireAdmin();
  } catch (error) {
    if (error instanceof AuthorizationError) redirect("/admin/login");
    throw error;
  }
  return (
    <>
      <header className="admin-header">
        <Link className="admin-brand" href="/admin">
          Portfolio admin
        </Link>
        <nav aria-label="Administration">
          <Link href="/admin">Overview</Link>
          <Link href="/admin/settings">Site settings</Link>
          <Link href="/admin/projects">Projects</Link>
          <Link href="/admin/content">Content</Link>
          <Link href="/admin/media">Media</Link>
          <Link href="/">View portfolio</Link>
        </nav>
        <EditorForm
          action={logoutAction}
          protectChanges={false}
          submitLabel="Sign out"
        />
      </header>
      <main id="main" className="admin-content">
        {children}
      </main>
    </>
  );
}
