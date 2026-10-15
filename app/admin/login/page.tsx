import Link from "next/link";
import { redirect } from "next/navigation";
import { loginAction, logoutAction } from "@/app/admin/actions";
import { EditorForm } from "@/components/admin/editor-form";
import { AuthorizationError } from "@/lib/auth/errors";
import { requireAdmin } from "@/lib/auth/require-admin";

export default async function LoginPage() {
  let allowed = false;
  let configured = true;
  try {
    await requireAdmin();
    allowed = true;
  } catch (error) {
    if (!(error instanceof AuthorizationError)) configured = false;
  }
  if (allowed) redirect("/admin");
  return (
    <main id="main" className="admin-login">
      <h1>Owner sign in</h1>
      <p>
        Use the account provisioned for this portfolio. Registration is closed.
      </p>
      {!configured && (
        <p role="alert">
          Sign in is unavailable. Check the server configuration or try again
          later.
        </p>
      )}
      <EditorForm
        action={loginAction}
        protectChanges={false}
        fields={[
          {
            name: "email",
            label: "Email",
            type: "email",
            required: true,
            maxLength: 254,
            autoComplete: "username",
          },
          {
            name: "password",
            label: "Password",
            type: "password",
            required: true,
            maxLength: 256,
            autoComplete: "current-password",
          },
        ]}
        submitLabel="Sign in"
      />
      <details>
        <summary>Clear an existing session</summary>
        <EditorForm
          action={logoutAction}
          protectChanges={false}
          submitLabel="Sign out"
        />
      </details>
      <Link href="/">Return to portfolio</Link>
    </main>
  );
}
