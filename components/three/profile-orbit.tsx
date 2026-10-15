"use client";
import { useState, useEffect, useCallback, type ComponentType } from "react";
import type { OrbitSceneProps } from "./orbit-scene";
export function ProfileOrbit() {
  const [eligible, setEligible] = useState(false);
  const [active, setActive] = useState(false);
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);
  const [angle, setAngle] = useState(0);
  const [Scene, setScene] = useState<ComponentType<OrbitSceneProps> | null>(
    null,
  );
  useEffect(() => {
    const query = matchMedia(
      "(min-width: 960px) and (prefers-reduced-motion: no-preference) and (pointer: fine)",
    );
    const lowMemory =
      "deviceMemory" in navigator &&
      typeof navigator.deviceMemory === "number" &&
      navigator.deviceMemory <= 2;
    const dataSaver =
      "connection" in navigator &&
      typeof navigator.connection === "object" &&
      navigator.connection !== null &&
      "saveData" in navigator.connection &&
      navigator.connection.saveData === true;
    const apply = () =>
      setEligible(
        query.matches &&
          navigator.hardwareConcurrency > 2 &&
          !lowMemory &&
          !dataSaver,
      );
    apply();
    query.addEventListener("change", apply);
    return () => query.removeEventListener("change", apply);
  }, []);
  const unavailable = useCallback(() => {
    setFailed(true);
    setActive(false);
  }, []);
  useEffect(() => {
    if (!active) {
      setPending(false);
      return;
    }
    if (Scene) return;
    let cancelled = false;
    setPending(true);
    import(/* webpackChunkName: "profile-orbit" */ "./orbit-scene")
      .then((module) => {
        if (!cancelled) {
          setScene(() => module.default);
          setPending(false);
        }
      })
      .catch(() => {
        if (!cancelled) unavailable();
      })
      .finally(() => {
        if (!cancelled) setPending(false);
      });
    return () => {
      cancelled = true;
    };
  }, [active, Scene, unavailable]);
  return (
    <>
      <div className="orbit" aria-hidden="true" />
      {eligible && active && Scene ? (
        <div className="orbit-stage">
          <Scene angle={angle} onUnavailable={unavailable} />
        </div>
      ) : null}
      {eligible && !failed ? (
        <div className="orbit-controls">
          {active ? (
            <>
              <button
                type="button"
                onClick={() => setAngle((value) => value - 0.35)}
                aria-label="Rotate orbit left"
                disabled={pending}
              >
                ←
              </button>
              <button
                type="button"
                onClick={() => setAngle((value) => value + 0.35)}
                aria-label="Rotate orbit right"
                disabled={pending}
              >
                →
              </button>
              <button type="button" onClick={() => setActive(false)}>
                Close orbit
              </button>
            </>
          ) : (
            <button type="button" onClick={() => setActive(true)}>
              Explore orbit
            </button>
          )}
          <span className="sr-only" aria-live="polite">
            {pending ? "Loading interactive orbit." : ""}
          </span>
        </div>
      ) : null}
      {failed ? (
        <p className="orbit-unavailable" role="status">
          Interactive view unavailable here.
        </p>
      ) : null}
    </>
  );
}
