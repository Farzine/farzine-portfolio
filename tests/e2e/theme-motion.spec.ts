import { expect, test, type Page } from "@playwright/test";
import { readFileSync, readdirSync } from "node:fs";
import { appOrigin } from "../fixtures/app-origin";

const graphicsChunks = readdirSync(".next/static/chunks").filter(
  (name) =>
    name.endsWith(".js") &&
    readFileSync(`.next/static/chunks/${name}`, "utf8").includes(
      "THREE.WebGLRenderer",
    ),
);
const sections = [
  "header",
  "about",
  "education",
  "experience",
  "portfolio",
  "skills",
  "links",
  "contacts",
];

// CI may have two cores or no GPU; verify the intended fallback on that hardware.
async function desktopEnhancementAllowed(page: Page) {
  return page.evaluate(() => {
    const connection = "connection" in navigator ? navigator.connection : null;
    return (
      matchMedia("(min-width: 992px) and (hover: hover) and (pointer: fine)")
        .matches &&
      !(navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4) &&
      !(
        "deviceMemory" in navigator &&
        typeof navigator.deviceMemory === "number" &&
        navigator.deviceMemory <= 4
      ) &&
      !(
        connection &&
        typeof connection === "object" &&
        "saveData" in connection &&
        connection.saveData
      )
    );
  });
}

test("explicit themes persist, retain geometry and render every source section", async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.emulateMedia({ colorScheme: "light", reducedMotion: "reduce" });
  await page.goto("/");
  await page.evaluate(() => document.fonts.ready);
  await info.attach("navigation-measurements.json", {
    contentType: "application/json",
    body: JSON.stringify(
      await page.evaluate(() => {
        const nav = performance.getEntriesByType("navigation")[0];
        return {
          viewport: { width: innerWidth, height: innerHeight },
          navigation: nav?.toJSON(),
          paint: performance
            .getEntriesByType("paint")
            .map((entry) => entry.toJSON()),
        };
      }),
      null,
      2,
    ),
  });
  const toggle = page.getByRole("button", { name: "Light theme", exact: true });
  await expect(toggle).toBeVisible();
  await expect(toggle).toHaveAttribute("aria-pressed", "false");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  const geometry = await page.locator(".home-name").boundingBox();
  await toggle.focus();
  await page.keyboard.press("Space");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await expect(toggle).toHaveAttribute("aria-pressed", "true");
  expect(await page.locator(".home-name").boundingBox()).toEqual(geometry);
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await expect(toggle).toHaveAttribute("aria-pressed", "true");
  for (const theme of ["light", "dark"]) {
    if (theme === "dark") await toggle.click();
    for (const section of sections) {
      await page.evaluate((key) => {
        location.hash = key;
      }, section);
      await expect(
        section === "header"
          ? page.locator(".home-role")
          : page.locator(`#${section}`),
      ).toBeVisible();
      await page.evaluate(async () => {
        await document.fonts.ready;
        if (document.activeElement instanceof HTMLElement)
          document.activeElement.blur();
      });
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBeTruthy();
      if (section === "skills") {
        const box = await page.locator(".skill-panel").first().boundingBox();
        if (info.project.name === "desktop")
          expect(box).toMatchObject({ x: 190, y: 129, width: 1080 });
        if (info.project.name === "mobile")
          expect(box).toMatchObject({ x: 40, y: 163, width: 330 });
      }
      if (["header", "about", "portfolio", "skills"].includes(section)) {
        for (const image of await page
          .locator(`#${section} img:not(.skill-logo img)`)
          .all()) {
          await image.scrollIntoViewIfNeeded();
          await expect
            .poll(() =>
              image.evaluate(
                (el) =>
                  el instanceof HTMLImageElement &&
                  el.complete &&
                  el.naturalWidth > 0,
              ),
            )
            .toBeTruthy();
        }
        await page.evaluate(() => scrollTo(0, 0));
        await page.screenshot({
          path: info.outputPath(`${theme}-${section}.png`),
          fullPage: true,
          animations: "disabled",
          scale: "css",
        });
      }
    }
  }
  // The added corner control must also fit the smallest supported screen.
  await page.setViewportSize({ width: 320, height: 700 });
  await page.evaluate(() => {
    location.hash = "header";
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
  await page.evaluate(() => {
    location.hash = "skills";
  });
  await expect(page.locator("#skills")).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
  expect(errors).toEqual([]);
});

test("theme applies before hydration and blocked storage keeps a working dark page", async ({
  browser,
}) => {
  for (const blocked of [false, true]) {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
    });
    await context.addInitScript((deny) => {
      if (deny) {
        Object.defineProperty(Storage.prototype, "getItem", {
          value: () => {
            throw Error("blocked storage");
          },
        });
        Object.defineProperty(Storage.prototype, "setItem", {
          value: () => {
            throw Error("blocked storage");
          },
        });
      } else localStorage.setItem("portfolio-theme", "light");
    }, blocked);
    const page = await context.newPage();
    // Stop hydration JS: the head script alone must restore the saved palette.
    await page.route("**/_next/static/**/*.js", (route) => route.abort());
    await page.goto(`${appOrigin}/`);
    await expect(page.locator("html")).toHaveAttribute(
      "data-theme",
      blocked ? "dark" : "light",
    );
    await expect(
      page.getByRole("button", { name: "Light theme", exact: true }),
    ).toBeHidden();
    await expect(
      page.getByRole("heading", { name: "Farzine Hossen" }),
    ).toBeVisible();
    await page.unrouteAll();
    await page.reload();
    await page
      .getByRole("button", { name: "Light theme", exact: true })
      .click();
    await expect(page.locator("html")).toHaveAttribute(
      "data-theme",
      blocked ? "light" : "dark",
    );
    await context.close();
  }
});

test("graphics remain deferred and reduced-motion or WebGL failure preserves project interaction", async ({
  page,
}) => {
  expect(graphicsChunks.length).toBeGreaterThan(0);
  const requests: string[] = [];
  const errors: string[] = [];
  page.on("request", (request) => requests.push(request.url()));
  page.on("pageerror", (error) => errors.push(error.message));
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Light theme" })).toBeVisible();
  expect(
    requests.some((url) => graphicsChunks.some((chunk) => url.includes(chunk))),
  ).toBe(false);
  await page.goto("/#portfolio");
  const link = page.locator(".project-image-link").first();
  await link.focus();
  await expect(page.locator(".project-webgl")).toHaveCount(0);
  await page.waitForTimeout(250); // Exceed the intentional enhancement delay.
  expect(
    requests.some((url) => graphicsChunks.some((chunk) => url.includes(chunk))),
  ).toBe(false);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.addInitScript(() => {
    Object.defineProperty(HTMLCanvasElement.prototype, "getContext", {
      value: () => null,
    });
  });
  await page.reload();
  await link.focus();
  if (await desktopEnhancementAllowed(page)) {
    await expect
      .poll(() =>
        requests.some((url) =>
          graphicsChunks.some((chunk) => url.includes(chunk)),
        ),
      )
      .toBe(true);
  } else {
    await page.waitForTimeout(250);
    expect(
      requests.some((url) =>
        graphicsChunks.some((chunk) => url.includes(chunk)),
      ),
    ).toBe(false);
  }
  await expect(page.locator(".project-webgl")).toHaveCount(0);
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("dialog", { name: "GSA-SUST website", exact: true }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(link).toBeFocused();
  expect(errors).toEqual([]);
});

test("project depth enhancement renders on demand and releases GPU resources", async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.addInitScript(() => {
    const metrics = {
      draws: 0,
      deletedBuffers: 0,
      deletedPrograms: 0,
      contexts: [] as WebGL2RenderingContext[],
    };
    Object.defineProperty(window, "__graphicsMetrics", { value: metrics });
    const draw = WebGL2RenderingContext.prototype.drawArrays;
    WebGL2RenderingContext.prototype.drawArrays = function (
      ...args: Parameters<typeof draw>
    ) {
      metrics.draws++;
      return draw.apply(this, args);
    };
    const deleteBuffer = WebGL2RenderingContext.prototype.deleteBuffer;
    WebGL2RenderingContext.prototype.deleteBuffer = function (
      ...args: Parameters<typeof deleteBuffer>
    ) {
      metrics.deletedBuffers++;
      return deleteBuffer.apply(this, args);
    };
    const deleteProgram = WebGL2RenderingContext.prototype.deleteProgram;
    WebGL2RenderingContext.prototype.deleteProgram = function (
      ...args: Parameters<typeof deleteProgram>
    ) {
      metrics.deletedPrograms++;
      return deleteProgram.apply(this, args);
    };
    const getContext = HTMLCanvasElement.prototype.getContext;
    Object.defineProperty(HTMLCanvasElement.prototype, "getContext", {
      value: function (
        this: HTMLCanvasElement,
        ...args: Parameters<typeof getContext>
      ) {
        const context = getContext.apply(this, args);
        if (context instanceof WebGL2RenderingContext)
          metrics.contexts.push(context);
        return context;
      },
    });
  });
  await page.goto("/#portfolio");
  const link = page.locator(".project-image-link").first();
  await expect(page.getByRole("button", { name: "Light theme" })).toBeVisible();
  await link.focus();
  const eligible = await desktopEnhancementAllowed(page);
  const supported =
    eligible &&
    (await page.evaluate(() => {
      const gl = document
        .createElement("canvas")
        .getContext("webgl2", { failIfMajorPerformanceCaveat: true });
      gl?.getExtension("WEBGL_lose_context")?.loseContext();
      return !!gl;
    }));
  if (!supported) {
    await page.waitForTimeout(250);
    await expect(page.locator(".project-webgl")).toHaveCount(0);
    expect(
      await page.evaluate(() => Reflect.get(window, "__graphicsMetrics").draws),
    ).toBe(0);
    return;
  }
  await expect(link).toHaveClass(/has-webgl/);
  await expect(page.locator(".project-webgl")).toHaveCount(1);
  expect(
    await page
      .locator(".project-webgl")
      .evaluate(
        (canvas) =>
          canvas instanceof HTMLCanvasElement &&
          canvas.width <= canvas.clientWidth * 1.5 + 1,
      ),
  ).toBe(true);
  await page.waitForTimeout(600); // The finite transition must become idle.
  const settled = await page.evaluate(
    () => Reflect.get(window, "__graphicsMetrics").draws,
  );
  expect(settled).toBeGreaterThan(0);
  await page.waitForTimeout(250);
  expect(
    await page.evaluate(() => Reflect.get(window, "__graphicsMetrics").draws),
  ).toBe(settled);
  await link.hover();
  await page.mouse.move(400, 290);
  await expect(link).toHaveClass(/has-webgl/);
  await page.screenshot({
    path: info.outputPath("desktop-project-hover.png"),
    scale: "css",
    animations: "disabled",
  });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator(".project-webgl")).toHaveCount(0);
  await expect(link).not.toHaveClass(/has-webgl/);
  const cleanup = await page.evaluate(() => {
    const m = Reflect.get(window, "__graphicsMetrics");
    return {
      buffers: m.deletedBuffers,
      programs: m.deletedPrograms,
      lost: m.contexts.every((gl: WebGL2RenderingContext) =>
        gl.isContextLost(),
      ),
    };
  });
  expect(cleanup.buffers).toBeGreaterThan(0);
  expect(cleanup.programs).toBeGreaterThan(0);
  expect(cleanup.lost).toBe(true);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  // Media-query change listeners run in the rendering update, before a new focus.
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      ),
  );
  await link.evaluate((element) => element.blur());
  for (let i = 0; i < 3; i++) {
    const next = page.locator(".project-image-link").nth(i);
    await next.focus();
    await expect(next).toHaveClass(/has-webgl/);
    await expect(page.locator(".project-webgl")).toHaveCount(1);
  }
  await page.evaluate(() => {
    location.hash = "contacts";
  });
  await expect(page.locator(".project-webgl")).toHaveCount(0);
  expect(errors).toEqual([]);
});

test("source role typing preserves accessible text and stops for reduced motion", async ({
  page,
}) => {
  await page.goto("/");
  const role = page.locator(".role-text");
  await expect(role).toHaveText("Software Engineer");
  await expect(page.locator(".home-role .sr-only")).toHaveText(
    "Software Engineer, AI Enthusiast",
  );
  await expect.poll(() => role.textContent()).not.toBe("Software Engineer");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(role).toHaveText("Software Engineer");
  await page.waitForTimeout(300);
  await expect(role).toHaveText("Software Engineer");
  await page.evaluate(() => {
    location.hash = "contacts";
  });
  await expect(role).toBeHidden();
  await page.evaluate(() => {
    location.hash = "header";
  });
  await expect(role).toBeVisible();
  await expect(role).toHaveText("Software Engineer");
});

test("slow and failed skill logos keep readable content within the original slots", async ({
  page,
}) => {
  let finish: (() => void) | undefined;
  const pause = new Promise<void>((resolve) => {
    finish = resolve;
  });
  await page.route(
    (url) => url.origin !== appOrigin && !url.pathname.startsWith("/_next/"),
    async (route) => {
      await pause;
      await route.abort();
    },
  );
  await page.goto("/#skills", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("button", { name: "Light theme" })).toBeVisible();
  const slot = page.locator(".skill-logo").first();
  await slot.scrollIntoViewIfNeeded();
  await expect(slot.locator(".skill-logo-pending")).toBeVisible();
  await expect(slot).toContainText("C++");
  finish?.();
  await expect(slot.locator("img")).toHaveCount(0);
  await expect(slot).toContainText("C++");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
});
