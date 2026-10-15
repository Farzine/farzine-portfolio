"use client";

import Link from "next/link";

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main id="main" className="container message-page">
      <h1>Unable to load this page</h1>
      <p>Please try again in a moment.</p>
      <button type="button" onClick={reset}>
        Try again
      </button>
      <Link href="/">Return home</Link>
    </main>
  );
}
