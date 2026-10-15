"use client";

import { useEffect, useRef } from "react";

export function useProjectAccent() {
  const ref = useRef<HTMLAnchorElement>(null);
  const release = useRef<() => void>(() => {});
  useEffect(() => {
    const target = ref.current;
    if (!target) return;
    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    const desktop = matchMedia(
      "(min-width: 992px) and (hover: hover) and (pointer: fine)",
    );
    let timer: ReturnType<typeof setTimeout> | undefined;
    let generation = 0;
    let dispose: (() => void) | undefined;
    const connection = "connection" in navigator ? navigator.connection : null;
    function allowed() {
      return (
        !motion.matches &&
        desktop.matches &&
        !document.hidden &&
        !(
          connection &&
          typeof connection === "object" &&
          "saveData" in connection &&
          connection.saveData
        ) &&
        !(
          "deviceMemory" in navigator &&
          typeof navigator.deviceMemory === "number" &&
          navigator.deviceMemory <= 4
        ) &&
        !(navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4)
      );
    }
    function stop() {
      generation++;
      clearTimeout(timer);
      dispose?.();
      dispose = undefined;
    }
    function start() {
      stop();
      if (!allowed()) return;
      const current = generation;
      timer = setTimeout(async () => {
        try {
          const { mountProjectAccent } = await import("./project-accent");
          if (target && current === generation && allowed())
            dispose = mountProjectAccent(target);
        } catch {
          // Optional graphics/network failure keeps the original CSS brackets.
        }
      }, 180);
    }
    release.current = stop;
    target.addEventListener("pointerenter", start);
    target.addEventListener("focus", start);
    target.addEventListener("pointerleave", stop);
    target.addEventListener("blur", stop);
    motion.addEventListener("change", stop);
    desktop.addEventListener("change", stop);
    document.addEventListener("visibilitychange", stop);
    return () => {
      stop();
      target.removeEventListener("pointerenter", start);
      target.removeEventListener("focus", start);
      target.removeEventListener("pointerleave", stop);
      target.removeEventListener("blur", stop);
      motion.removeEventListener("change", stop);
      desktop.removeEventListener("change", stop);
      document.removeEventListener("visibilitychange", stop);
    };
  }, []);
  return { ref, stop: () => release.current() };
}
