"use client";
import "./globals.css";
export default function GlobalError({ reset }: { reset: () => void }) {
  return (
    <html lang="en">
      <body>
        <main tabIndex={-1} id="main" className="wrap section">
          <p className="eyebrow">Portfolio / Temporarily unavailable</p>
          <h1>Couldn’t load the portfolio.</h1>
          <p>
            Please try again. Your message or changes have not been confirmed.
          </p>
          <button type="button" className="button" onClick={reset}>
            Try again
          </button>{" "}
          <a href="/">Back to the profile</a>
        </main>
      </body>
    </html>
  );
}
