import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { login } from "../fixtures/admin";

async function audit(page: Page, state: string) {
  const result = await new AxeBuilder({ page }).analyze();
  expect(
    result.violations.map((violation) => ({
      rule: violation.id,
      help: violation.help,
      targets: violation.nodes.map((node) => node.target),
    })),
    state,
  ).toEqual([]);
}

for (const theme of ["dark", "light"]) {
  test(`accessible public sections, dialog and routes in ${theme}`, async ({
    page,
  }) => {
    test.setTimeout(90000);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    if (theme === "light")
      await page
        .getByRole("button", { name: "Light theme", exact: true })
        .click();
    await audit(page, `${theme} home`);
    for (const section of [
      "about",
      "education",
      "experience",
      "portfolio",
      "skills",
      "links",
      "contacts",
    ]) {
      await page.evaluate((key) => {
        window.location.hash = key;
      }, section);
      await expect(page.locator(`#${section}`)).toBeVisible();
      await audit(page, `${theme} ${section}`);
    }
    await page.goto("/#portfolio");
    const project = page.getByRole("link", {
      name: "Project details: GSA-SUST website",
      exact: true,
    });
    await project.focus();
    await page.keyboard.press("Enter");
    await expect(
      page.getByRole("dialog", { name: "GSA-SUST website", exact: true }),
    ).toBeVisible();
    await audit(page, `${theme} project dialog`);
    await page.keyboard.press("Escape");
    await expect(project).toBeFocused();
    for (const path of [
      "/projects",
      "/projects/gsa-sust",
      "/projects/does-not-exist",
      "/admin/login",
    ]) {
      await page.goto(path);
      await audit(page, `${theme} ${path}`);
    }
  });
}

test("@admin accessible owner forms and validation feedback at narrow/wide sizes", async ({
  page,
}) => {
  test.setTimeout(90000);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await login(page);
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 900 });
    for (const path of [
      "/admin",
      "/admin/settings",
      "/admin/projects/new",
      "/admin/content/experiences",
      "/admin/content/section_settings",
      "/admin/media",
    ]) {
      await page.goto(path);
      await expect(
        page.getByRole("heading", { level: 1 }).first(),
      ).toBeVisible();
      if (path.includes("/content/"))
        await page.locator("details").first().locator("summary").click();
      await audit(page, `admin ${width}px ${path}`);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        path,
      ).toBe(true);
    }
  }
  await page.goto("/admin/projects/new");
  await page
    .getByLabel("Title (required)", { exact: true })
    .fill("Local validation audit");
  await page
    .getByLabel("Slug (required)", { exact: true })
    .fill("INVALID SLUG");
  await page
    .getByRole("button", { name: "Create project", exact: true })
    .click();
  await expect(page.locator("#main").getByRole("status")).toBeFocused();
  await expect(
    page.getByLabel("Slug (required)", { exact: true }),
  ).toHaveAttribute("aria-invalid", "true");
  await audit(page, "admin inline validation");
});
