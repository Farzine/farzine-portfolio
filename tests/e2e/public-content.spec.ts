import { test, expect } from "@playwright/test";
import seed from "../../data/portfolio-seed.json" with { type: "json" };
test("all public sections render real seed content while personal facts stay private", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByText("Development preview", { exact: false }),
  ).toBeVisible();
  for (const section of seed.section_settings)
    await expect(
      page.getByRole("heading", { level: 2, name: section.title, exact: true }),
    ).toBeVisible();
  await expect(
    page.getByText("Nov 2025 - Feb 2026", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("March 2022 - Present", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Resume", exact: false }),
  ).toBeVisible();
  const html = await page.content();
  for (const fact of seed.profile_facts) expect(html).not.toContain(fact.value);
  expect(html).not.toContain("January 31, 2026");
  for (const width of [320, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
  }
});
test("project categories and every stable detail slug work with safe external links", async ({
  page,
}) => {
  await page.goto("/projects");
  await expect(page.locator(".project-card")).toHaveCount(15);
  await page.getByRole("link", { name: "App", exact: true }).click();
  await expect(page).toHaveURL(/category=App/);
  await expect(page.locator(".project-card")).toHaveCount(6);
  for (const project of seed.projects) {
    const response = await page.goto(`/projects/${project.slug}`);
    expect(response?.status()).toBe(200);
    await expect(
      page.getByRole("heading", { level: 1, name: project.title, exact: true }),
    ).toBeVisible();
    await expect(page.locator(".detail-cover")).toBeVisible();
    expect(
      await page
        .locator(".detail-cover")
        .evaluate(
          (img: HTMLImageElement) => img.complete && img.naturalWidth > 0,
        ),
    ).toBe(true);
  }
  const missing = await page.goto("/projects/not-a-real-project");
  expect(missing?.status()).toBe(404);
});

test("legacy project paths redirect to the preserved project", async ({
  page,
}) => {
  await page.goto("/projects/farmAI.html");
  await expect(page).toHaveURL(/\/projects\/farm-ai$/);
  await expect(
    page.getByRole("heading", { level: 1, name: "FarmAI", exact: true }),
  ).toBeVisible();
});
