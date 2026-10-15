import { TEST_PASSWORD } from "../helpers/supabase-fixture";
import { test, expect } from "@playwright/test";
import { signIn, save } from "./workflow";
import seed from "../../data/portfolio-seed.json" with { type: "json" };
test.beforeEach(async ({ request }) => {
  expect((await request.post("http://127.0.0.1:54399/__test/reset")).ok()).toBe(
    true,
  );
});
const cases = [
  {
    kind: "experiences",
    fields: {
      organization: "Fixture organization",
      role: "Fixture role",
      date_label: "Source date label",
      bullets: "First responsibility\nSecond responsibility",
    },
  },
  {
    kind: "education",
    fields: {
      institution: "Fixture institution",
      qualification: "Fixture qualification",
    },
  },
  {
    kind: "certifications",
    fields: { name: "Fixture certificate", issuer: "Fixture issuer" },
  },
  {
    kind: "achievements",
    fields: { name: "Fixture achievement", result: "Fixture result" },
  },
  { kind: "interests", fields: { name: "Fixture interest" } },
  {
    kind: "social_links",
    fields: { label: "Fixture social", url: "https://example.test/profile" },
  },
  {
    kind: "navigation_items",
    fields: { label: "Fixture resume", url: "https://example.test/resume.pdf" },
  },
] as const;
for (const item of cases)
  test(`${item.kind}: create, edit, archive and delete`, async ({ page }) => {
    await signIn(page);
    await page.goto(`/admin/content/${item.kind}/new`);
    await save(page);
    await expect(page.locator(".form-error[role=alert]")).toContainText(
      "highlighted",
    );
    expect(await page.locator("[aria-invalid=true]").count()).toBeGreaterThan(
      0,
    );
    for (const [field, value] of Object.entries(item.fields))
      await page.locator(`#${field}`).fill(value);
    if (item.kind === "navigation_items")
      await page.locator("#kind").selectOption("resume");
    await save(page);
    await expect(page.getByText("Item saved.", { exact: true })).toBeVisible();
    await page
      .getByRole("link", { name: "Open saved item", exact: true })
      .click();
    await expect(page).toHaveURL(/\/admin\/content\/[a-z_]+\/[a-f0-9-]{36}$/);
    const titleField =
      "organization" in item.fields
        ? "organization"
        : "institution" in item.fields
          ? "institution"
          : "label" in item.fields
            ? "label"
            : "name";
    await page.locator(`#${titleField}`).fill("Edited fixture item");
    await page.locator("#status").selectOption("published");
    await save(page);
    await expect(page.getByText("Item saved.", { exact: true })).toBeVisible();
    await page.reload();
    await expect(page.locator(`#${titleField}`)).toHaveValue(
      "Edited fixture item",
    );
    await page.locator("#status").selectOption("archived");
    await save(page);
    await expect(page.getByText("Item saved.", { exact: true })).toBeVisible();
    await page.reload();
    await page
      .getByRole("button", { name: "Delete item", exact: true })
      .click();
    await page
      .getByLabel("Item title", { exact: true })
      .fill("Edited fixture item");
    await page
      .getByRole("button", { name: "Permanently delete", exact: true })
      .click();
    await expect(page).toHaveURL(
      new RegExp(`/admin/content/${item.kind}\\?deleted=1$`),
    );
    await expect(
      page.getByRole("link", { name: "Edited fixture item", exact: true }),
    ).toHaveCount(0);
  });
test("skill parent visibility and safe group deletion", async ({
  page,
  request,
}) => {
  await signIn(page);
  await page.goto("/admin/content/skill_groups/new");
  await page.locator("#name").fill("Fixture skill group");
  await save(page);
  await expect(page.getByText("Item saved.", { exact: true })).toBeVisible();
  const groupId = await page.locator("input[name=id]").inputValue();
  await page.goto("/admin/content/skills/new");
  await page.locator("#group_id").selectOption(groupId);
  await page.locator("#name").fill("Fixture skill");
  await page.locator("#status").selectOption("published");
  await save(page);
  await expect(page.getByText("Item saved.", { exact: true })).toBeVisible();
  const skillId = await page.locator("input[name=id]").inputValue();
  await page.goto(`/admin/content/skill_groups/${groupId}`);
  await page.getByRole("button", { name: "Delete item", exact: true }).click();
  await page
    .getByLabel("Item title", { exact: true })
    .fill("Fixture skill group");
  await page
    .getByRole("button", { name: "Permanently delete", exact: true })
    .click();
  await expect(page.locator(".form-error[role=alert]")).toContainText(
    "referenced",
  );
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  // Public rendering requires a published profile and section as well as the parent group.
  await page.goto("/admin/settings");
  await page.locator("#status").selectOption("published");
  await save(page);
  await expect(
    page.getByText("Site settings saved.", { exact: true }),
  ).toBeVisible();
  const section = seed.section_settings.find((item) => item.key === "skills");
  expect(section).toBeTruthy();
  await page.goto(`/admin/content/section_settings/${section?.id}`);
  await page.locator("#status").selectOption("published");
  await page.locator("#visible").check();
  await save(page);
  await expect(page.getByText("Item saved.", { exact: true })).toBeVisible();
  expect(await (await request.get("/")).text()).not.toContain(
    "Fixture skill group",
  );
  await page.goto(`/admin/content/skill_groups/${groupId}`);
  await page.locator("#status").selectOption("published");
  await save(page);
  await expect(page.getByText("Item saved.", { exact: true })).toBeVisible();
  const home = await (await request.get("/")).text();
  expect(home).toContain("Fixture skill group");
  expect(home).toContain("Fixture skill");
  await page.goto(`/admin/content/skills/${skillId}`);
  await page.getByRole("button", { name: "Delete item", exact: true }).click();
  await page.getByLabel("Item title", { exact: true }).fill("Fixture skill");
  await page
    .getByRole("button", { name: "Permanently delete", exact: true })
    .click();
  await expect(page).toHaveURL(/deleted=1$/);
  await page.goto(`/admin/content/skill_groups/${groupId}`);
  await page.getByRole("button", { name: "Delete item", exact: true }).click();
  await page
    .getByLabel("Item title", { exact: true })
    .fill("Fixture skill group");
  await page
    .getByRole("button", { name: "Permanently delete", exact: true })
    .click();
  await expect(page).toHaveURL(/deleted=1$/);
});
test("section display order/visibility and explicit contact fact privacy", async ({
  page,
  request,
}) => {
  await signIn(page);
  await page.goto("/admin/settings");
  await page.locator("#status").selectOption("published");
  await save(page);
  await expect(
    page.getByText("Site settings saved.", { exact: true }),
  ).toBeVisible();
  await page.goto("/admin/content/profile_facts/new");
  await page.locator("#label").fill("Fixture public email");
  await page.locator("#kind").selectOption("email");
  await page.locator("#value").fill("not-an-email");
  await save(page);
  await expect(page.locator("#value-error")).toContainText("valid email");
  await page.locator("#value").fill("fixture@example.test");
  await save(page);
  await expect(page.getByText("Item saved.", { exact: true })).toBeVisible();
  const id = await page.locator("input[name=id]").inputValue();
  expect(await (await request.get("/")).text()).not.toContain(
    "fixture@example.test",
  );
  const contact = seed.section_settings.find((item) => item.key === "contact");
  const about = seed.section_settings.find((item) => item.key === "about");
  await page.goto(`/admin/content/section_settings/${contact?.id}`);
  await page.locator("#status").selectOption("published");
  await page.locator("#visible").check();
  await page.locator("#title").fill("Fixture contact section");
  await page.locator("#sort_order").fill("0");
  await save(page);
  await expect(page.getByText("Item saved.", { exact: true })).toBeVisible();
  await page.goto(`/admin/content/section_settings/${about?.id}`);
  await page.locator("#status").selectOption("published");
  await page.locator("#visible").check();
  await page.locator("#sort_order").fill("100");
  await save(page);
  await expect(page.getByText("Item saved.", { exact: true })).toBeVisible();
  await page.goto(`/admin/content/profile_facts/${id}`);
  await page.locator("#is_public").check();
  await save(page);
  await expect(page.getByText("Item saved.", { exact: true })).toBeVisible();
  let html = await (await request.get("/")).text();
  expect(html).toContain("fixture@example.test");
  expect(html.indexOf('id="contact"')).toBeLessThan(html.indexOf('id="about"'));
  await page.goto(`/admin/content/section_settings/${contact?.id}`);
  await page.locator("#visible").uncheck();
  await save(page);
  await expect(page.getByText("Item saved.", { exact: true })).toBeVisible();
  html = await (await request.get("/")).text();
  expect(html).not.toContain('id="contact"');
  await page.goto(`/admin/content/profile_facts/${id}`);
  await page.locator("#is_public").uncheck();
  await save(page);
  await expect(page.getByText("Item saved.", { exact: true })).toBeVisible();
  await page.reload();
  await page.getByRole("button", { name: "Delete item", exact: true }).click();
  await page
    .getByLabel("Item title", { exact: true })
    .fill("Fixture public email");
  await page
    .getByRole("button", { name: "Permanently delete", exact: true })
    .click();
  await expect(page).toHaveURL(/deleted=1$/);
  await page.goto("/admin/content/unknown");
  await expect(
    page.getByRole("heading", { name: "This path ends here." }),
  ).toBeVisible();
});
test("loaded collection actions reject anonymous and non-admin sessions", async ({
  page,
  request,
}) => {
  await signIn(page);
  await page.goto("/admin/content/interests/new");
  await page.locator("#name").fill("Forbidden anonymous interest");
  await page.context().clearCookies();
  await save(page);
  await expect(page.locator(".form-error[role=alert]")).toContainText(
    "session",
  );
  await signIn(page);
  await page.goto("/admin/content/interests/new");
  await page.locator("#name").fill("Forbidden member interest");
  const cookieName = (await page.context().cookies()).find((cookie) =>
    cookie.name.startsWith("sb-"),
  )?.name;
  expect(cookieName).toBeTruthy();
  const token = await request.post(
    "http://127.0.0.1:54399/auth/v1/token?grant_type=password",
    { data: { email: "member@example.test", password: TEST_PASSWORD } },
  );
  const session: unknown = await token.json();
  await page.context().clearCookies();
  await page.context().addCookies([
    {
      name: cookieName ?? "",
      value: `base64-${Buffer.from(JSON.stringify(session)).toString("base64url")}`,
      url: "http://127.0.0.1:3102",
    },
  ]);
  await save(page);
  await expect(page.locator(".form-error[role=alert]")).toContainText(
    "session",
  );
  await signIn(page);
  await page.goto("/admin/content/interests");
  await expect(
    page.getByRole("link", { name: /Forbidden .* interest/ }),
  ).toHaveCount(0);
});
