import { test, expect } from "@playwright/test";
test("production cannot serve development seed or private fields with demo flag enabled", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "A profile",
  );
  await expect(
    page.getByText("Portfolio content has not been published yet."),
  ).toBeVisible();
  const html = await page.content();
  for (const value of [
    "Development preview",
    "1521781591",
    "02 January 2003",
    "farzine07@student.sust.edu",
  ])
    expect(html).not.toContain(value);
  await page.goto("/projects");
  await expect(page.locator(".project-card")).toHaveCount(0);
  const response = await page.goto("/projects/farm-ai");
  expect(response?.status()).toBe(404);
});
