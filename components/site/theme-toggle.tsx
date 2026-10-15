"use client";

import { useEffect, useState } from "react";
import { defaultPublicCopy, type PublicCopy } from "@/lib/content/public-copy";
import { themeStorageKey } from "@/lib/theme";

export function ThemeToggle({
  copy = defaultPublicCopy,
}: {
  copy?: PublicCopy;
}) {
  const [ready, setReady] = useState(false);
  const [light, setLight] = useState(false);
  useEffect(() => {
    setLight(document.documentElement.dataset.theme === "light");
    setReady(true);
    function storage(event: StorageEvent) {
      if (event.key !== themeStorageKey && event.key !== null) return;
      const next = event.newValue === "light";
      document.documentElement.dataset.theme = next ? "light" : "dark";
      setLight(next);
    }
    window.addEventListener("storage", storage);
    return () => window.removeEventListener("storage", storage);
  }, []);
  return (
    <button
      type="button"
      className="theme-toggle"
      hidden={!ready}
      aria-label={copy.lightTheme}
      title={light ? copy.darkTheme : copy.lightTheme}
      aria-pressed={light}
      onClick={() => {
        const next = !light;
        document.documentElement.dataset.theme = next ? "light" : "dark";
        setLight(next);
        try {
          localStorage.setItem(themeStorageKey, next ? "light" : "dark");
        } catch {
          // Storage can be disabled; the current page still switches normally.
        }
      }}
    >
      <i className={`bx ${light ? "bx-moon" : "bx-sun"}`} aria-hidden="true" />
    </button>
  );
}
