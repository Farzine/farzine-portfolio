import { test, expect } from "@playwright/test";
test("profile has usable navigation, portrait and no overflow", async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Farzine",
  );
  await expect(page.getByRole("img", { name: "Farzine Hossen" })).toBeVisible();
  await expect
    .poll(() =>
      page
        .getByRole("img", { name: "Farzine Hossen" })
        .evaluate(
          (img: HTMLImageElement) => img.complete && img.naturalWidth > 0,
        ),
    )
    .toBe(true);
  await page
    .getByRole("img", { name: "Farzine Hossen" })
    .evaluate(async (img: HTMLImageElement) => {
      await img.decode();
    });
  await page.locator(".profile-art").screenshot({
    path: `/tmp/portfolio-portrait-${testInfo.project.name}.png`,
  });

  await page.screenshot({
    path: `/tmp/portfolio-public-${testInfo.project.name}.png`,
    fullPage: false,
  });
  await page.getByRole("link", { name: "About", exact: true }).click();
  await expect(page).toHaveURL(/#about$/);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  expect(errors).toEqual([]);
});
test("missing routes and admin setup state are safe", async ({ page }) => {
  const response = await page.goto("/does-not-exist");
  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "This path ends here",
  );
  const adminResponse = await page.goto("/admin/login");
  expect(adminResponse?.headers()["cache-control"]).toContain("no-store");
  expect(adminResponse?.headers()["x-robots-tag"]).toContain("noindex");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Owner login",
  );
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    "content",
    /noindex/,
  );
});
test("reduced motion and keyboard skip link work", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("link", { name: "Skip to content" }),
  ).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#main$/);
  await expect(page.locator("#main")).toBeFocused();
  expect(
    await page.evaluate(
      () => getComputedStyle(document.documentElement).scrollBehavior,
    ),
  ).toBe("auto");
});
