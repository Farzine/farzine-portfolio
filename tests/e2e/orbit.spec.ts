import { test, expect } from "@playwright/test";
import config from "../../playwright.config";
declare global {
  interface Window {
    _orbitDraws?: number;
    _orbitDeletes?: number;
  }
}
test.use({
  launchOptions: {
    ...config.use?.launchOptions,
    args: [
      "--no-sandbox",
      "--disable-dev-shm-usage",
      "--enable-unsafe-swiftshader",
      "--use-gl=angle",
      "--use-angle=swiftshader",
    ],
  },
});
test("orbit loads only after activation, renders on demand and releases resources", async ({
  page,
}, info) => {
  test.skip(
    info.project.name === "mobile",
    "Static mobile fallback is covered separately.",
  );
  await page.addInitScript(() => {
    const state = window;
    state._orbitDraws = 0;
    state._orbitDeletes = 0;
    const context = HTMLCanvasElement.prototype.getContext;
    Object.defineProperty(HTMLCanvasElement.prototype, "getContext", {
      configurable: true,
      writable: true,
      value: function (
        this: HTMLCanvasElement,
        kind: string,
        attributes?: object,
      ) {
        return Reflect.apply(context, this, [
          kind,
          kind === "webgl2"
            ? { ...attributes, failIfMajorPerformanceCaveat: false }
            : attributes,
        ]);
      },
    });
    const gl = WebGL2RenderingContext.prototype;
    const draw = gl.drawElements;
    gl.drawElements = function (...args) {
      state._orbitDraws = (state._orbitDraws ?? 0) + 1;
      return Reflect.apply(draw, this, args);
    };
    const remove = gl.deleteBuffer;
    gl.deleteBuffer = function (...args) {
      state._orbitDeletes = (state._orbitDeletes ?? 0) + 1;
      return Reflect.apply(remove, this, args);
    };
  });
  const requests: string[] = [];
  page.on("request", (req) => requests.push(req.url()));
  await page.goto("/");
  await expect(
    page.getByRole("button", { name: "Explore orbit", exact: true }),
  ).toBeVisible();
  expect(requests.some((url) => url.includes("profile-orbit.js"))).toBe(false);
  await page
    .getByRole("button", { name: "Explore orbit", exact: true })
    .click();
  await expect(page.locator("canvas.orbit-canvas")).toBeVisible();
  expect(requests.some((url) => url.includes("profile-orbit.js"))).toBe(true);
  await expect
    .poll(() => page.evaluate(() => Number(Reflect.get(window, "_orbitDraws"))))
    .toBeGreaterThan(0);
  await page.waitForTimeout(150);
  const read = () =>
    page.evaluate(() => Number(Reflect.get(window, "_orbitDraws")));
  const idle = await read();
  await page.waitForTimeout(250);
  expect(await read()).toBe(idle);
  await page
    .getByRole("button", { name: "Rotate orbit right", exact: true })
    .click();
  await expect.poll(read).toBeGreaterThan(idle);
  await page.screenshot({
    path: "/tmp/portfolio-orbit-desktop.png",
    fullPage: false,
  });
  await page.locator("footer").scrollIntoViewIfNeeded();
  await page.waitForTimeout(150);
  const offscreen = await read();
  await page
    .getByRole("button", { name: "Rotate orbit right", exact: true })
    .evaluate((button) => (button as HTMLButtonElement).click());
  await page.waitForTimeout(250);
  expect(await read()).toBe(offscreen);
  await page.getByRole("button", { name: "Close orbit", exact: true }).click();
  await expect(page.locator("canvas.orbit-canvas")).toHaveCount(0);
  await expect
    .poll(() =>
      page.evaluate(() => Number(Reflect.get(window, "_orbitDeletes"))),
    )
    .toBeGreaterThan(0);
});
test("reduced motion and small viewports retain static profile without graphics downloads", async ({
  page,
}) => {
  const requests: string[] = [];
  page.on("request", (req) => requests.push(req.url()));
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.locator(".profile-art img")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Explore orbit", exact: true }),
  ).toHaveCount(0);
  expect(requests.some((url) => url.includes("profile-orbit.js"))).toBe(false);
  await page.setViewportSize({ width: 375, height: 812 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
test("WebGL failure keeps portrait, content and navigation usable", async ({
  page,
}, info) => {
  test.skip(
    info.project.name === "mobile",
    "Mobile intentionally has no graphics activation control.",
  );
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    Object.defineProperty(HTMLCanvasElement.prototype, "getContext", {
      configurable: true,
      writable: true,
      value: function (
        this: HTMLCanvasElement,
        kind: string,
        attributes?: object,
      ) {
        return kind === "webgl2"
          ? null
          : Reflect.apply(original, this, [kind, attributes]);
      },
    });
  });
  await page.goto("/");
  await page
    .getByRole("button", { name: "Explore orbit", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText(
    "Interactive view unavailable",
  );
  await expect(page.locator(".profile-art img")).toBeVisible();
  await expect(
    page.getByRole("heading", { name: /Farzine/ }).first(),
  ).toBeVisible();
  await expect(page.locator("canvas")).toHaveCount(0);
});
test("portfolio and navigation work without JavaScript", async ({
  browser,
}) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    viewport: { width: 375, height: 812 },
  });
  const page = await context.newPage();
  await page.goto("http://127.0.0.1:3100/");
  await expect(page.locator(".profile-art img")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Explore orbit", exact: true }),
  ).toHaveCount(0);
  await page
    .getByRole("link", { name: "Explore projects", exact: true })
    .click();
  await expect(page).toHaveURL(/\/projects$/);
  await expect(page.locator(".project-card")).toHaveCount(15);
  await context.close();
});
