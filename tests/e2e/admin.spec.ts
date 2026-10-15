import {
  login,
  setSession,
  captureSave,
  assertDenied,
} from "../fixtures/admin";
import { createClient } from "@supabase/supabase-js";
import { expect, test, type Page } from "@playwright/test";
import accounts from "../fixtures/admin-accounts.json";
import { appOrigin as origin } from "../fixtures/app-origin";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "";
if (url !== "http://127.0.0.1:54321")
  throw new Error(
    "Admin mutation tests require the fixed isolated local Supabase stack.",
  );
const pageErrors = new WeakMap<Page, string[]>();
test.describe.configure({ mode: "serial" });
test.use({ actionTimeout: 10000, navigationTimeout: 15000 });
test.beforeEach(({ page }) => {
  const errors: string[] = [];
  pageErrors.set(page, errors);
  page.on("pageerror", (error) => errors.push(error.message));
});
test.afterEach(({ page }) => {
  expect(pageErrors.get(page)).toEqual([]);
});

test("@admin private routes, failed credentials, non-admin metadata and secure logout", async ({
  page,
  context,
  browser,
}) => {
  const publicAuth = createClient(url, key, {
    auth: { persistSession: false },
  });
  const signup = await publicAuth.auth.signUp({
    email: `closed-registration-${Date.now()}@local-test.invalid`,
    password: "Local-test-only!NotAnAccount9",
  });
  expect(signup.error?.code).toBe("signup_disabled");
  const response = await page.goto("/admin/settings");
  await expect(page).toHaveURL(/\/admin\/login/);
  expect(response?.headers()["cache-control"]).toContain("no-store");
  expect(response?.headers()["x-robots-tag"]).toContain("noindex");
  await page.getByLabel("Email", { exact: false }).fill(accounts.admin.email);
  await page
    .getByLabel("Password", { exact: false })
    .fill("incorrect-password");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(
    page.getByRole("status").filter({ hasText: "Unable to sign in" }),
  ).toBeVisible();
  await page
    .getByLabel("Email", { exact: false })
    .fill(accounts.nonAdmin.email);
  await page
    .getByLabel("Password", { exact: false })
    .fill(accounts.nonAdmin.password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(
    page.getByRole("status").filter({ hasText: "Unable to sign in" }),
  ).toBeVisible();
  const unauthorized = await browser.newContext();
  try {
    await setSession(unauthorized, "nonAdmin");
    const other = await unauthorized.newPage();
    await other.goto(`${origin}/admin/projects`);
    await expect(other).toHaveURL(/\/admin\/login/);
    expect(await other.content()).not.toContain("PRIVATE_TEST_CANARY");
  } finally {
    await unauthorized.close();
  }
  await login(page);
  await page.screenshot({
    path: "test-results/admin-desktop-overview.png",
    animations: "disabled",
  });
  const cookies = (await context.cookies()).filter((cookie) =>
    cookie.name.includes("auth-token"),
  );
  expect(cookies.length).toBeGreaterThan(0);
  expect(
    cookies.every(
      (cookie) => cookie.httpOnly && cookie.sameSite === "Lax" && cookie.secure,
    ),
  ).toBe(true);
  expect(await page.evaluate(() => document.cookie)).not.toContain(
    "auth-token",
  );
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await expect(page).toHaveURL(/\/admin\/login/);
  expect(
    (await context.cookies()).filter((cookie) =>
      cookie.name.includes("auth-token"),
    ),
  ).toHaveLength(0);
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin\/login/);
});

test("@admin actual refresh preserves HTTP-only private sessions and invalid sessions recover", async ({
  browser,
}) => {
  const context = await browser.newContext();
  try {
    await setSession(context, "admin", true);
    const before = (await context.cookies())
      .map((cookie) => cookie.value)
      .join("");
    const page = await context.newPage();
    const response = await page.goto(`${origin}/admin`);
    await expect(
      page.getByRole("heading", { name: "Overview", exact: true }),
    ).toBeVisible();
    const after = (await context.cookies()).filter((cookie) =>
      cookie.name.includes("auth-token"),
    );
    expect(after.map((cookie) => cookie.value).join("")).not.toBe(before);
    expect(after.every((cookie) => cookie.httpOnly && cookie.secure)).toBe(
      true,
    );
    expect(response?.headers()["cache-control"]).toContain("no-store");
    await context.clearCookies();
    await context.addCookies([
      { name: "sb-127-auth-token", value: "forged-invalid-token", url: origin },
    ]);
    await page.goto(`${origin}/admin`);
    await expect(page).toHaveURL(/\/admin\/login/);
  } finally {
    await context.close();
  }
});

test("@admin project CRUD, publication, slug/order/media/gallery, validation and direct-action guards", async ({
  page,
  browser,
}) => {
  test.setTimeout(90000);
  const anonymous = await browser.newContext();
  const nonAdmin = await browser.newContext();
  const adminApi = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const auth = await adminApi.auth.signInWithPassword(accounts.admin);
  expect(auth.error).toBeNull();
  let id = "";
  const privateImageId = crypto.randomUUID();
  const slug = `local-cms-test-${Date.now()}`;
  try {
    await setSession(nonAdmin, "nonAdmin");
    await login(page);
    await page.goto("/admin/projects/new");
    await page
      .getByLabel("Title (required)", { exact: true })
      .fill("Local CMS regression fixture");
    await page.getByLabel("Slug (required)", { exact: true }).fill(slug);
    await page
      .getByLabel("Summary", { exact: true })
      .fill("Disposable local test content.");
    await page
      .getByLabel("Detailed description")
      .fill("<script>alert('text')</script>\nSecond paragraph");
    await page
      .getByLabel("Technologies", { exact: true })
      .fill("TypeScript\nNext.js");
    await page.getByLabel("Cover image").selectOption({ index: 1 });
    const create = await captureSave(page, "Create project");
    await expect(page).toHaveURL(/\/admin\/projects\/[a-f0-9-]+\?created=1/);
    id = new URL(page.url()).pathname.split("/").at(-1) || "";
    await assertDenied(create, anonymous, nonAdmin);
    const preview = await page.context().newPage();
    await preview.goto(`${origin}/admin/projects/${id}/preview`);
    await expect(
      preview.getByRole("heading", {
        name: "Local CMS regression fixture",
        exact: true,
      }),
    ).toBeVisible();
    await preview.close();
    const forbiddenPreview = await anonymous.request.get(
      `${origin}/admin/projects/${id}/preview`,
    );
    expect(await forbiddenPreview.text()).not.toContain(
      "Local CMS regression fixture",
    );
    expect(
      (await anonymous.request.get(`${origin}/projects/${slug}`)).status(),
    ).toBe(404);
    await page
      .getByLabel("Slug (required)", { exact: true })
      .fill("../invalid");
    await captureSave(page, "Save project");
    await expect(
      page.getByText("Use lowercase letters, numbers and single hyphens.", {
        exact: true,
      }),
    ).toBeVisible();
    await page.getByLabel("Slug (required)", { exact: true }).fill(slug);
    await page.getByLabel("Status", { exact: true }).selectOption("published");
    await captureSave(page, "Save project");
    await expect(
      page.getByText("Set a publication time before publishing.", {
        exact: true,
      }),
    ).toBeVisible();
    await page
      .getByLabel("Publication time (UTC)")
      .fill("2026-01-01T00:00:00Z");
    await page.getByLabel("Slug (required)", { exact: true }).fill("gsa-sust");
    await captureSave(page, "Save project");
    await expect(
      page.getByRole("status").filter({ hasText: "already in use" }),
    ).toBeVisible();
    await page.getByLabel("Slug (required)", { exact: true }).fill(slug);
    const image = await adminApi.from("media_assets").insert({
      id: privateImageId,
      label: "Private local test image",
      kind: "image",
      bucket: "portfolio-private",
      object_path: `${crypto.randomUUID()}/${crypto.randomUUID()}.png`,
      mime_type: "image/png",
      size_bytes: 100,
      is_public: false,
    });
    expect(image.error).toBeNull();
    await page.reload();
    await page.getByLabel("Status", { exact: true }).selectOption("published");
    await page
      .getByLabel("Publication time (UTC)")
      .fill("2026-01-01T00:00:00Z");
    await page.getByLabel("Cover image").selectOption(privateImageId);
    await captureSave(page, "Save project");
    await expect(
      page
        .getByRole("status")
        .filter({ hasText: "Published content requires public images." }),
    ).toBeVisible();
    await page.getByLabel("Cover image").selectOption({ index: 1 });
    await page.getByLabel("Featured", { exact: true }).check();
    await page.getByLabel("Display order", { exact: false }).fill("7");
    const save = await captureSave(page, "Save project");
    await expect(
      page.getByRole("status").filter({ hasText: "Project saved." }),
    ).toBeVisible();
    await assertDenied(save, anonymous, nonAdmin);
    const foreignOrigin = await page.context().request.post(save.url(), {
      headers: {
        origin: "https://attacker.invalid",
        "content-type": save.headers()["content-type"],
        "next-action": save.headers()["next-action"],
      },
      data: save.postDataBuffer() || undefined,
    });
    expect(foreignOrigin.status()).toBeGreaterThanOrEqual(400);
    const stale = await page.context().request.post(save.url(), {
      headers: {
        origin,
        "content-type": save.headers()["content-type"],
        "next-action": save.headers()["next-action"],
      },
      data: save.postDataBuffer() || undefined,
    });
    expect(await stale.text()).toContain("This record changed or was removed.");
    const publicPage = await anonymous.newPage();
    const published = await publicPage.goto(`${origin}/projects/${slug}`);
    expect(published?.status()).toBe(200);
    await expect(
      publicPage.getByText("<script>alert('text')</script>", { exact: true }),
    ).toBeVisible();
    await page
      .getByLabel("Gallery image", { exact: false })
      .selectOption({ index: 1 });
    await page
      .getByLabel("Caption", { exact: true })
      .fill("Local gallery caption");
    const add = await captureSave(page, "Save gallery image");
    await expect(
      page.getByRole("status").filter({ hasText: "Gallery image saved." }),
    ).toBeVisible();
    await assertDenied(add, anonymous, nonAdmin);
    await publicPage.reload();
    await expect(
      publicPage.getByText("Local gallery caption", { exact: true }),
    ).toBeVisible();
    await expect(publicPage.locator("img").first()).toBeVisible();
    await page
      .getByLabel("Caption", { exact: true })
      .fill("Updated local caption");
    await page.getByLabel("Gallery order", { exact: false }).fill("3");
    await captureSave(page, "Save gallery image");
    await publicPage.reload();
    await expect(
      publicPage.getByText("Updated local caption", { exact: true }),
    ).toBeVisible();
    expect(
      (await adminApi.from("project_media").select("id").eq("project_id", id))
        .data,
    ).toHaveLength(1);
    await page.getByLabel("Confirm removal", { exact: false }).check();
    const remove = await captureSave(page, "Remove gallery image");
    await expect(
      page.getByText("No gallery images.", { exact: true }),
    ).toBeVisible();
    await assertDenied(remove, anonymous, nonAdmin);
    await page
      .getByLabel("Slug (required)", { exact: true })
      .fill(`${slug}-renamed`);
    await captureSave(page, "Save project");
    await expect(
      page.getByRole("status").filter({ hasText: "Project saved." }),
    ).toBeVisible();
    expect(
      (await anonymous.request.get(`${origin}/projects/${slug}`)).status(),
    ).toBe(404);
    expect(
      (
        await anonymous.request.get(`${origin}/projects/${slug}-renamed`)
      ).status(),
    ).toBe(200);
    await page.getByLabel("Status", { exact: true }).selectOption("draft");
    await captureSave(page, "Save project");
    await expect(
      page.getByRole("status").filter({ hasText: "Project saved." }),
    ).toBeVisible();
    expect(
      (
        await anonymous.request.get(`${origin}/projects/${slug}-renamed`)
      ).status(),
    ).toBe(404);
    await page.getByLabel("Status", { exact: true }).selectOption("archived");
    await captureSave(page, "Save project");
    await expect(
      page.getByRole("status").filter({ hasText: "Project saved." }),
    ).toBeVisible();
    await page.reload();
    await page
      .getByLabel("Type the current slug to confirm deletion")
      .fill("wrong-confirmation");
    await captureSave(page, "Delete project permanently");
    await expect(
      page
        .getByRole("status")
        .filter({ hasText: "Confirmation did not match" }),
    ).toBeVisible();
    await page
      .getByLabel("Type the current slug to confirm deletion")
      .fill(`${slug}-renamed`);
    const deletion = await captureSave(page, "Delete project permanently");
    await expect(page).toHaveURL(/\/admin\/projects\?deleted=1/);
    await assertDenied(deletion, anonymous, nonAdmin);
    const result = await adminApi.from("projects").select("id").eq("id", id);
    expect(result.data).toHaveLength(0);
    await page
      .getByLabel("Search", { exact: true })
      .fill("PRIVATE_TEST_CANARY");
    await page.getByRole("button", { name: "Apply filters" }).click();
    await expect(
      page.getByRole("link", { name: "PRIVATE_TEST_CANARY", exact: true }),
    ).toBeVisible();
  } finally {
    if (id) await adminApi.from("projects").delete().eq("id", id);
    await adminApi.from("media_assets").delete().eq("id", privateImageId);
    await anonymous.close();
    await nonAdmin.close();
  }
});

test("@admin settings validation, stale protection, public freshness and narrow mobile editing", async ({
  page,
  browser,
}) => {
  const anonymous = await browser.newContext();
  const nonAdmin = await browser.newContext();
  const adminApi = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  await adminApi.auth.signInWithPassword(accounts.admin);
  const before = await adminApi
    .from("site_settings")
    .select("display_name")
    .eq("id", true)
    .single();
  if (!before.data) throw new Error("Missing local settings fixture.");
  try {
    await setSession(nonAdmin, "nonAdmin");
    await login(page);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/admin/settings");
    await expect(page.getByLabel("Display name (required)")).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({
      path: "test-results/admin-mobile-settings.png",
      animations: "disabled",
    });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    await page.getByLabel("Primary action URL").fill("javascript:alert(1)");
    await captureSave(page, "Save site settings");
    await expect(
      page
        .getByText("Use an http, https or mailto URL.", { exact: false })
        .first(),
    ).toBeVisible();
    await page.getByLabel("Primary action URL").fill("");
    await page
      .getByLabel("Display name (required)")
      .fill("Local settings verification");
    const save = await captureSave(page, "Save site settings");
    await expect(
      page.getByRole("status").filter({ hasText: "Site settings saved." }),
    ).toBeVisible();
    await assertDenied(save, anonymous, nonAdmin);
    const stale = await page.context().request.post(save.url(), {
      headers: {
        origin,
        "content-type": save.headers()["content-type"],
        "next-action": save.headers()["next-action"],
      },
      data: save.postDataBuffer() || undefined,
    });
    expect(await stale.text()).toContain("This record changed or was removed.");
    const home = await anonymous.request.get(origin);
    expect(await home.text()).toContain("Local settings verification");
    await page
      .getByLabel("Display name (required)")
      .fill(before.data.display_name);
    await captureSave(page, "Save site settings");
    await expect(
      page.getByRole("status").filter({ hasText: "Site settings saved." }),
    ).toBeVisible();
    await page.getByLabel("Biography").fill("Unsaved local text");
    page.once("dialog", (dialog) => dialog.dismiss());
    await page.getByRole("link", { name: "Overview", exact: true }).click();
    await expect(page).toHaveURL(/\/admin\/settings/);
    page.once("dialog", (dialog) => dialog.accept());
    await page.getByRole("link", { name: "Overview", exact: true }).click();
    await expect(
      page.getByRole("heading", { name: "Overview", exact: true }),
    ).toBeVisible();
  } finally {
    await adminApi
      .from("site_settings")
      .update({ display_name: before.data.display_name })
      .eq("id", true);
    await anonymous.close();
    await nonAdmin.close();
  }
});
