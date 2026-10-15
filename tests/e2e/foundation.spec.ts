import { expect, test } from "@playwright/test";

test("home keeps identity, working navigation, local assets and dark default", async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Farzine Hossen", exact: true }),
  ).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(
    page.getByRole("link", { name: "GitHub", exact: true }),
  ).toHaveAttribute("href", "https://github.com/Farzine/");
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: testInfo.outputPath("home.png") });
  if (testInfo.project.name === "mobile")
    await page.getByLabel("Open navigation").click();
  await page
    .getByRole("link", { name: "About", exact: true })
    .filter({ visible: true })
    .click();
  await expect(page.locator("#about")).toHaveClass(/section-show/);
  await expect(
    page.locator('#about img[src="/assets/img/profile.png"]'),
  ).toBeVisible();
  expect(
    await page
      .locator("#about img")
      .evaluate(
        (img: HTMLImageElement) => img.complete && img.naturalWidth > 0,
      ),
  ).toBeTruthy();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
  expect(errors).toEqual([]);
});

test("unknown paths return a real 404 with recovery navigation", async ({
  page,
}) => {
  const response = await page.goto("/missing-page");
  expect(response?.status()).toBe(404);
  await expect(
    page.getByRole("heading", { name: "Page not found" }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Return home" }).click();
  await expect(page).toHaveURL("/");
});

test("home navigation remains usable without JavaScript", async ({
  browser,
}) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    viewport: { width: 390, height: 844 },
  });
  const page = await context.newPage();
  await page.goto("http://127.0.0.1:3000/");
  await page.getByLabel("Open navigation").click();
  await expect(
    page
      .getByRole("link", { name: "Projects", exact: true })
      .filter({ visible: true }),
  ).toBeVisible();
  await context.close();
});
