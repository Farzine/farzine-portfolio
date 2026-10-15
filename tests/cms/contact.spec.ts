import { test, expect } from "@playwright/test";
import { signIn, save } from "./workflow";
import seed from "../../data/portfolio-seed.json" with { type: "json" };
test.beforeEach(async ({ request }) => {
  expect((await request.post("http://127.0.0.1:54399/__test/reset")).ok()).toBe(
    true,
  );
});
test("contact messages are validated, stored privately, rate limited and manageable by the owner", async ({
  page,
  context,
  request,
}) => {
  await signIn(page);
  await page.goto("/admin/settings");
  await page.locator("#status").selectOption("published");
  await page.locator("#contact_form_enabled").check();
  await save(page);
  await expect(
    page.getByText("Site settings saved.", { exact: true }),
  ).toBeVisible();
  const contact = seed.section_settings.find((item) => item.key === "contact");
  await page.goto(`/admin/content/section_settings/${contact?.id}`);
  await page.locator("#status").selectOption("published");
  await page.locator("#visible").check();
  await save(page);
  await expect(page.getByText("Item saved.", { exact: true })).toBeVisible();
  await context.clearCookies();
  await page.goto("/");
  await expect(
    page.getByRole("button", { name: "Store message for owner", exact: true }),
  ).toBeVisible();
  await page.locator("#contact-name").fill("Fixture sender");
  await page.locator("#contact-email").fill("fixture@example.test");
  await page
    .locator("#contact-message")
    .fill("Private fixture message for the owner.");
  await page.locator("#contact-company").fill("Bot field");
  await page
    .getByRole("button", { name: "Store message for owner", exact: true })
    .click();
  await expect(
    page.locator(".contact-form .form-error[role=alert]"),
  ).toBeVisible();
  await page.locator("#contact-company").fill("");
  await request.post("http://127.0.0.1:54399/__test/fail-contact");
  await page
    .getByRole("button", { name: "Store message for owner", exact: true })
    .click();
  await expect(
    page.locator(".contact-form .form-error[role=alert]"),
  ).toContainText("not confirmed as stored");
  await expect(page.locator("#contact-message")).toHaveValue(
    "Private fixture message for the owner.",
  );
  for (let i = 0; i < 5; i++) {
    await page.locator("#contact-name").fill("Fixture sender");
    await page.locator("#contact-email").fill("fixture@example.test");
    await page
      .locator("#contact-message")
      .fill(`Private fixture message number ${i} for the owner.`);
    await page
      .getByRole("button", { name: "Store message for owner", exact: true })
      .click();
    await expect(page.locator(".contact-form .form-success")).toContainText(
      "stored",
    );
    await expect(page.locator("#contact-name")).toHaveValue("");
  }
  await page.locator("#contact-name").fill("Fixture sender");
  await page.locator("#contact-email").fill("fixture@example.test");
  await page
    .locator("#contact-message")
    .fill("A rate-limited fixture message for the owner.");
  await page
    .getByRole("button", { name: "Store message for owner", exact: true })
    .click();
  await expect(
    page.locator(".contact-form .form-error[role=alert]"),
  ).toContainText("Too many messages");
  await expect(page.locator("#contact-message")).toHaveValue(
    "A rate-limited fixture message for the owner.",
  );
  expect(await (await request.get("/")).text()).not.toContain(
    "Private fixture message number",
  );
  expect(
    (
      await request.get("http://127.0.0.1:54399/rest/v1/contact_messages")
    ).status(),
  ).toBe(403);
  expect(
    (
      await request.post(
        "http://127.0.0.1:54399/rest/v1/rpc/submit_contact_message",
        {
          data: {
            sender_name: "Attacker",
            sender_email: "test@example.test",
            body_text: "Direct RPC attack.",
            rate_key: "1".repeat(64),
          },
        },
      )
    ).status(),
  ).toBe(403);
  await signIn(page);
  await page.goto("/admin/messages");
  await expect(page.getByRole("article")).toHaveCount(5);
  const message = page.getByRole("article").first();
  await message
    .getByRole("button", { name: "Mark as read", exact: true })
    .click();
  await expect(message.getByText("Read /", { exact: false })).toBeVisible();
  await page.reload();
  await page
    .getByRole("article")
    .first()
    .getByRole("button", { name: "Delete item", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByLabel("Item title", { exact: true })
    .fill("Fixture sender");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Permanently delete", exact: true })
    .click();
  await expect(page).toHaveURL(/\/admin\/messages\?deleted=1$/);
  await expect(page.getByRole("article")).toHaveCount(4);
  await page.goto("/admin/settings");
  await page.locator("#contact_form_enabled").uncheck();
  await save(page);
  await expect(
    page.getByText("Site settings saved.", { exact: true }),
  ).toBeVisible();
  await page.goto("/");
  await expect(
    page.getByRole("button", { name: "Store message for owner", exact: true }),
  ).toHaveCount(0);
});
