"use client";
import Link from "next/link";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main id="main" className="wrap section">
      <p className="eyebrow">Something went wrong</p>
      <h1>Couldn’t load this page.</h1>
      <p>Please try again. If the problem continues, return later.</p>
      <button type="button" className="button" onClick={reset}>
        Try again
      </button>{" "}
      <Link href="/">Back to the profile</Link>
    </main>
  );
}
