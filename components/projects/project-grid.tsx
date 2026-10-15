"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";

export function ProjectGrid({
  children,
  categories,
  allLabel,
  initialCategory = "",
}: {
  children: ReactNode;
  categories: string[];
  allLabel: string;
  initialCategory?: string;
}) {
  const [category, setCategory] = useState(initialCategory);
  const [count, setCount] = useState<number | null>(null);
  const grid = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let shown = 0;
    grid.current
      ?.querySelectorAll<HTMLElement>("[data-category]")
      .forEach((card) => {
        card.hidden = !!category && card.dataset.category !== category;
        if (!card.hidden) shown++;
      });
    setCount(shown);
  }, [category]);
  return (
    <>
      {categories.length > 1 && (
        <form
          className="project-filters"
          action="/projects"
          method="get"
          aria-label="Filter projects"
        >
          {["", ...categories].map((value) => (
            <button
              key={value}
              type="submit"
              name="category"
              value={value}
              aria-pressed={category === value}
              onClick={(event) => {
                event.preventDefault();
                setCategory(value);
              }}
            >
              {value || allLabel}
            </button>
          ))}
        </form>
      )}
      <span className="sr-only" role="status">
        {count !== null ? `${count} projects shown` : ""}
      </span>
      <div ref={grid} className="project-grid">
        {children}
      </div>
    </>
  );
}
