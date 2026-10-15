"use client";
import { defaultPublicCopy, type PublicCopy } from "@/lib/content/public-copy";

import { useEffect, useId, useRef, useState } from "react";
import type { Portfolio } from "@/lib/content/public-model";

export function Navigation({
  items,
  initialSection = "header",
  copy = defaultPublicCopy,
}: {
  items: Portfolio["navigation"];
  initialSection?: string;
  copy?: PublicCopy;
}) {
  const [active, setActive] = useState(initialSection);
  const [open, setOpen] = useState(false);
  const details = useRef<HTMLDetailsElement>(null);
  const menuId = useId();
  useEffect(() => {
    function update() {
      const key = window.location.hash.slice(1);
      setActive(
        items.some((item) => item.sectionKey === key) ? key : initialSection,
      );
    }
    function navigate() {
      update();
      const target = document.getElementById(window.location.hash.slice(1));
      target
        ?.querySelector<HTMLElement>("h1, h2")
        ?.focus({ preventScroll: true });
      window.scrollTo(0, 0);
    }
    function outside(event: PointerEvent) {
      if (
        event.target instanceof Node &&
        !details.current?.contains(event.target) &&
        details.current
      )
        details.current.open = false;
    }
    update();
    window.addEventListener("hashchange", navigate);
    document.addEventListener("pointerdown", outside);
    return () => {
      window.removeEventListener("hashchange", navigate);
      document.removeEventListener("pointerdown", outside);
    };
  }, [items, initialSection]);
  const links = (
    <ul>
      {items.map((item) => (
        <li key={item.sectionKey}>
          <a
            href={`/#${item.sectionKey}`}
            aria-current={active === item.sectionKey ? "page" : undefined}
            onClick={() => {
              if (details.current) details.current.open = false;
            }}
          >
            {item.label}
          </a>
        </li>
      ))}
    </ul>
  );
  return (
    <>
      <nav className="desktop-navigation" aria-label={copy.mainNav}>
        {links}
      </nav>
      <details
        ref={details}
        className="mobile-navigation"
        onToggle={(event) => setOpen(event.currentTarget.open)}
        onKeyDown={(event) => {
          if (event.key === "Escape" && details.current?.open) {
            details.current.open = false;
            details.current.querySelector("summary")?.focus();
          }
        }}
      >
        <summary
          aria-label={open ? copy.closeNav : copy.openNav}
          aria-controls={menuId}
        >
          <i className={`bx ${open ? "bx-x" : "bx-menu"}`} aria-hidden="true" />
        </summary>
        <nav id={menuId} aria-label={copy.mobileNav}>
          {links}
        </nav>
      </details>
    </>
  );
}
