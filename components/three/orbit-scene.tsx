"use client";
import { useEffect, useRef } from "react";
import {
  WebGLRenderer,
  Scene,
  PerspectiveCamera,
  Group,
  Mesh,
  MeshBasicMaterial,
  IcosahedronGeometry,
  TorusGeometry,
} from "three";
export type OrbitSceneProps = { angle: number; onUnavailable: () => void };
export default function OrbitScene({ angle, onUnavailable }: OrbitSceneProps) {
  const host = useRef<HTMLDivElement>(null);
  const update = useRef<((angle: number) => void) | null>(null);
  useEffect(() => {
    const mount = host.current;
    if (!mount) return;
    // A fresh canvas also survives Strict Mode effect replay after context disposal.
    const element = document.createElement("canvas");
    element.className = "orbit-canvas";
    element.tabIndex = -1;
    mount.appendChild(element);
    const context = element.getContext("webgl2", {
      alpha: true,
      antialias: true,
      failIfMajorPerformanceCaveat: true,
    });
    if (!context) {
      element.remove();
      onUnavailable();
      return;
    }
    let renderer: WebGLRenderer;
    try {
      renderer = new WebGLRenderer({
        canvas: element,
        context,
        alpha: true,
        antialias: true,
        powerPreference: "low-power",
      });
    } catch {
      context.getExtension("WEBGL_lose_context")?.loseContext();
      element.remove();
      onUnavailable();
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    const scene = new Scene();
    const camera = new PerspectiveCamera(38, 1, 0.1, 10);
    camera.position.z = 4;
    const group = new Group();
    scene.add(group);
    const shape = new IcosahedronGeometry(1, 0);
    const ring = new TorusGeometry(1.35, 0.006, 3, 64);
    const wire = new MeshBasicMaterial({
      color: 0xb9dfad,
      wireframe: true,
      transparent: true,
      opacity: 0.42,
    });
    const soft = new MeshBasicMaterial({
      color: 0xb9dfad,
      transparent: true,
      opacity: 0.4,
    });
    const core = new Mesh(shape, wire);
    const orbit = new Mesh(ring, soft);
    orbit.rotation.x = 1.05;
    group.add(core, orbit);
    let visible = true;
    let disposed = false;
    let frame = 0;
    let direction = 0;
    let previousWidth = 0,
      previousHeight = 0;
    const render = () => {
      frame = 0;
      if (disposed || !visible || document.hidden) return;
      const { width, height } = element.getBoundingClientRect();
      if (width <= 0 || height <= 0) return;
      if (width !== previousWidth || height !== previousHeight) {
        renderer.setSize(width, height, false);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        previousWidth = width;
        previousHeight = height;
      }
      group.rotation.y = direction;
      group.rotation.x = 0.15;
      try {
        renderer.render(scene, camera);
      } catch {
        onUnavailable();
      }
    };
    const schedule = () => {
      if (!disposed && visible && !document.hidden && !frame)
        frame = requestAnimationFrame(render);
    };
    update.current = (value) => {
      direction = value;
      schedule();
    };
    const resize = new ResizeObserver(schedule);
    resize.observe(element);
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (!visible && frame) {
        cancelAnimationFrame(frame);
        frame = 0;
      }
      if (visible) schedule();
    });
    observer.observe(element);
    const visibility = () => {
      if (document.hidden && frame) {
        cancelAnimationFrame(frame);
        frame = 0;
      } else schedule();
    };
    const lost = (event: Event) => {
      event.preventDefault();
      onUnavailable();
    };
    document.addEventListener("visibilitychange", visibility);
    element.addEventListener("webglcontextlost", lost);
    schedule();
    return () => {
      disposed = true;
      update.current = null;
      if (frame) cancelAnimationFrame(frame);
      resize.disconnect();
      observer.disconnect();
      document.removeEventListener("visibilitychange", visibility);
      element.removeEventListener("webglcontextlost", lost);
      shape.dispose();
      ring.dispose();
      wire.dispose();
      soft.dispose();
      scene.clear();
      renderer.dispose();
      renderer.forceContextLoss();
      element.remove();
    };
  }, [onUnavailable]);
  useEffect(() => {
    update.current?.(angle);
  }, [angle]);
  return <div ref={host} className="orbit-frame" aria-hidden="true" />;
}
