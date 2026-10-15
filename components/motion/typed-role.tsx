"use client";

import { useEffect, useRef, useState } from "react";

export function TypedRole({ roles }: { roles: string[] }) {
  const [text, setText] = useState(roles[0] || "");
  const target = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const element = target.current;
    if (!element || roles.length < 2) return;
    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    let timer: ReturnType<typeof setTimeout> | undefined;
    let visible = false;
    let index = 0;
    let count = Array.from(roles[0]).length;
    let deleting = true;
    function stop() {
      clearTimeout(timer);
    }
    function step() {
      if (motion.matches || !visible || document.hidden) return;
      const letters = Array.from(roles[index]);
      count += deleting ? -1 : 1;
      setText(letters.slice(0, count).join(""));
      let delay = deleting ? 45 : 85;
      if (count === 0) {
        index = (index + 1) % roles.length;
        deleting = false;
        delay = 200;
      } else if (count === letters.length) {
        deleting = true;
        delay = 1800;
      }
      timer = setTimeout(step, delay);
    }
    function update() {
      stop();
      if (motion.matches) {
        index = 0;
        count = Array.from(roles[0]).length;
        deleting = true;
        setText(roles[0]);
      } else if (visible && !document.hidden) timer = setTimeout(step, 1800);
    }
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      update();
    });
    observer.observe(element);
    motion.addEventListener("change", update);
    document.addEventListener("visibilitychange", update);
    return () => {
      stop();
      observer.disconnect();
      motion.removeEventListener("change", update);
      document.removeEventListener("visibilitychange", update);
    };
  }, [roles]);
  return (
    <>
      <span className="sr-only">{roles.join(", ")}</span>
      <span ref={target} className="role-text" aria-hidden="true">
        {text || "\u00a0"}
      </span>
    </>
  );
}
