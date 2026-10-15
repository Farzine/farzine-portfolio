import Link from "next/link";
import { getSupabaseConfig, isDevelopmentDemo } from "@/lib/supabase/config";
import { LoginForm } from "@/components/admin/login-form";
export const metadata = {
  title: "Owner login",
  robots: { index: false, follow: false },
};
export default function LoginPage() {
  return (
    <main tabIndex={-1} id="main" className="wrap section admin-login">
      <p className="eyebrow">Owner workspace</p>
      <h1>Owner login</h1>
      {isDevelopmentDemo() ? (
        <p>
          Development preview is read-only. Disable PORTFOLIO_DEMO_MODE before
          connecting to the owner workspace.
        </p>
      ) : getSupabaseConfig() ? (
        <LoginForm />
      ) : (
        <p>
          Supabase is not configured. Follow the setup documentation to connect
          an owner account. Saving and uploads are unavailable.
        </p>
      )}
      <Link className="text-link" href="/">
        ← Back to the profile
      </Link>
    </main>
  );
}
