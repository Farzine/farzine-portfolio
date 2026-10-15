import { expect, type Page } from "@playwright/test";
import { TEST_PASSWORD } from "../helpers/supabase-fixture";
export async function signIn(page: Page, email = "owner@example.test") {
  await page.goto("/admin/login");
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Password", { exact: true }).fill(TEST_PASSWORD);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  if (email === "owner@example.test")
    await expect(page).toHaveURL(/\/admin$/, { timeout: 15000 });
  else
    await expect(page.locator(".form-error[role=alert]")).toContainText(
      "Unable to sign in",
    );
}
export async function save(page: Page) {
  const response = page.waitForResponse(
    (result) =>
      result.request().method() === "POST" &&
      Boolean(result.request().headers()["next-action"]),
  );
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  await response;
  await expect(
    page.getByRole("button", { name: "Save changes", exact: true }),
  ).toBeEnabled();
}
