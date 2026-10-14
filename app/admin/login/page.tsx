import Link from "next/link";
export const metadata = {
  title: "Owner login",
  robots: { index: false, follow: false },
};
export default function LoginPage() {
  return (
    <main id="main" className="wrap section">
      <p className="eyebrow">Owner workspace</p>
      <h1>Owner login</h1>
      <p>
        Admin authentication is not configured yet. Follow the setup
        documentation to connect Supabase.
      </p>
      <Link className="button" href="/">
        Back to the profile
      </Link>
    </main>
  );
}
