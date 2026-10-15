import Link from "next/link";

export default function NotFound() {
  return (
    <main id="main" className="container message-page">
      <h1>Page not found</h1>
      <p>This page could not be found.</p>
      <Link href="/">Return home</Link>
    </main>
  );
}
