import {
  BufferGeometry,
  Float32BufferAttribute,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
  Scene,
  WebGLRenderer,
} from "three";

let disposeActive: (() => void) | undefined;

// One demand-rendered scene: the two existing corner brackets, with a slight depth response.
export function mountProjectAccent(
  target: HTMLAnchorElement,
): (() => void) | undefined {
  disposeActive?.();
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("webgl2", {
    alpha: true,
    antialias: false,
    powerPreference: "low-power",
    failIfMajorPerformanceCaveat: true,
  });
  if (!context) return;
  let renderer: WebGLRenderer;
  try {
    renderer = new WebGLRenderer({
      canvas,
      context,
      alpha: true,
      antialias: false,
    });
  } catch {
    context.getExtension("WEBGL_lose_context")?.loseContext();
    return;
  }
  const geometry = new BufferGeometry();
  const material = new MeshBasicMaterial({ color: 0xffffff });
  const mesh = new Mesh(geometry, material);
  const scene = new Scene();
  scene.add(mesh);
  const camera = new PerspectiveCamera(30, 1, 0.1, 1000);
  camera.position.z = 600;
  let frame = 0;
  let disposed = false;
  let x = 0.045,
    y = -0.045,
    goalX = 0,
    goalY = 0;
  let last = 0,
    slowFrames = 0;
  canvas.className = "project-webgl";
  canvas.setAttribute("aria-hidden", "true");
  function dispose() {
    if (disposed) return;
    disposed = true;
    cancelAnimationFrame(frame);
    target.classList.remove("has-webgl");
    target.removeEventListener("pointermove", pointer);
    canvas.removeEventListener("webglcontextlost", lost);
    observer.disconnect();
    resize.disconnect();
    geometry.dispose();
    material.dispose();
    renderer.dispose();
    renderer.forceContextLoss();
    canvas.remove();
    if (disposeActive === dispose) disposeActive = undefined;
  }
  function render(now: number) {
    frame = 0;
    if (disposed) return;
    if (last && now - last > 40) slowFrames++;
    else slowFrames = 0;
    last = now;
    if (slowFrames >= 5) {
      dispose();
      return;
    }
    x += (goalX - x) * 0.24;
    y += (goalY - y) * 0.24;
    mesh.rotation.set(x, y, 0);
    try {
      renderer.render(scene, camera);
      target.classList.add("has-webgl");
    } catch {
      dispose();
      return;
    }
    if (Math.abs(goalX - x) + Math.abs(goalY - y) > 0.0003)
      frame = requestAnimationFrame(render);
  }
  function requestRender() {
    if (!frame && !disposed) {
      last = 0;
      frame = requestAnimationFrame(render);
    }
  }
  function pointer(event: PointerEvent) {
    const bounds = target.getBoundingClientRect();
    goalX =
      ((event.clientY - bounds.top - bounds.height / 2) / bounds.height) * 0.07;
    goalY =
      ((event.clientX - bounds.left - bounds.width / 2) / bounds.width) * 0.07;
    requestRender();
  }
  function lost(event: Event) {
    event.preventDefault();
    dispose();
  }
  function layout() {
    if (disposed) return;
    const { width, height } = target.getBoundingClientRect();
    if (!width || !height) {
      dispose();
      return;
    }
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5));
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.fov = (2 * Math.atan(height / 1200) * 180) / Math.PI;
    camera.updateProjectionMatrix();
    const points: number[] = [];
    function rectangle(left: number, top: number, w: number, h: number) {
      const a = left - width / 2,
        b = height / 2 - top;
      points.push(
        a,
        b,
        0,
        a + w,
        b - h,
        0,
        a + w,
        b,
        0,
        a,
        b,
        0,
        a,
        b - h,
        0,
        a + w,
        b - h,
        0,
      );
    }
    rectangle(15, 15, 48, 3);
    rectangle(15, 15, 3, 48);
    rectangle(width - 63, height - 18, 48, 3);
    rectangle(width - 18, height - 63, 3, 48);
    geometry.setAttribute("position", new Float32BufferAttribute(points, 3));
    geometry.computeBoundingSphere();
    requestRender();
  }
  const observer = new IntersectionObserver(([entry]) => {
    if (!entry.isIntersecting) dispose();
  });
  const resize = new ResizeObserver(layout);
  target.appendChild(canvas);
  target.addEventListener("pointermove", pointer);
  canvas.addEventListener("webglcontextlost", lost);
  observer.observe(target);
  resize.observe(target);
  disposeActive = dispose;
  layout();
  return dispose;
}
