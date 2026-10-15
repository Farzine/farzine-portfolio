import { test, expect, request as playwrightRequest } from "@playwright/test";
import { TEST_PASSWORD } from "../helpers/supabase-fixture";
import { signIn, save } from "./workflow";
test.beforeEach(async ({ request }) => {
  const response = await request.post("http://127.0.0.1:54399/__test/reset");
  expect(response.ok()).toBe(true);
});
test("anonymous, failed login and non-admin sessions cannot open private content", async ({
  page,
}) => {
  await page.goto("/admin/projects");
  await expect(page).toHaveURL(/\/admin\/login$/);
  await page.getByLabel("Email", { exact: true }).fill("owner@example.test");
  await page
    .getByLabel("Password", { exact: true })
    .fill("wrong-test-password");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.locator(".form-error[role=alert]")).toContainText(
    "Unable to sign in",
  );
  await signIn(page, "member@example.test");
  await expect(page.locator(".form-error[role=alert]")).toContainText(
    "Unable to sign in",
  );
  await page.goto("/admin/settings");
  await expect(page).toHaveURL(/\/admin\/login$/);
  expect(await page.content()).not.toContain("January 31, 2026");
});
test("owner can create, preview, publish, reorder, rename, unpublish, archive and delete a project", async ({
  page,
  request,
}, testInfo) => {
  await signIn(page);
  await expect(page).toHaveURL(/\/admin$/);
  await page.getByRole("link", { name: "Create project", exact: true }).click();
  await page
    .getByLabel("Title", { exact: false })
    .first()
    .fill("CMS integration project");
  await page
    .getByLabel("Slug", { exact: false })
    .fill("cms-integration-project");
  await page
    .getByLabel("Publication status", { exact: true })
    .selectOption("published");
  await save(page);
  await expect(page.locator("#summary-error")).toContainText("Add a summary");
  await page
    .getByLabel("Summary", { exact: false })
    .fill("An isolated test record, never imported into the real portfolio.");
  await page
    .getByLabel("Publication status", { exact: true })
    .selectOption("draft");
  await page
    .getByLabel("Cover image", { exact: true })
    .selectOption("/assets/img/project/gsa-sust.png");
  await page
    .getByLabel("Cover image description", { exact: true })
    .fill("Test project screenshot");
  await page
    .getByLabel("Project details", { exact: true })
    .fill(
      "<script>window.__portfolio_injected=true</script>\n\nPlain text content.",
    );
  await page
    .getByLabel("Technologies", { exact: true })
    .fill("NextJS, PostgreSQL");
  await save(page);
  await expect(page.getByText("Project saved.", { exact: true })).toBeVisible();
  await page
    .getByRole("link", { name: "Open saved project", exact: true })
    .click();
  await expect(page).toHaveURL(/\/admin\/projects\/[a-f0-9-]{36}$/);
  const editorUrl = page.url();
  await page
    .getByRole("link", { name: "Preview saved content", exact: true })
    .click();
  await expect(
    page.getByText("Protected preview", { exact: false }),
  ).toBeVisible();
  await expect(page.locator(".project-story")).toContainText(
    "<script>window.__portfolio_injected=true</script>",
  );
  expect(await page.evaluate(() => "__portfolio_injected" in window)).toBe(
    false,
  );
  expect(
    (await request.get("/projects/cms-integration-project")).status(),
  ).toBe(404);
  await page.goto(editorUrl);
  await page
    .getByLabel("Publication status", { exact: true })
    .selectOption("published");
  await page.getByLabel("Display order", { exact: false }).fill("2");
  await page.getByLabel("Feature on homepage", { exact: true }).check();
  await save(page);
  await expect(page.getByText("Project saved.", { exact: true })).toBeVisible();
  const published = await request.get("/projects/cms-integration-project");
  expect(published.status()).toBe(200);
  expect(await published.text()).toContain("CMS integration project");
  await page.getByLabel("Slug", { exact: false }).fill("cms-renamed-project");
  await save(page);
  await expect(page.getByText("Project saved.", { exact: true })).toBeVisible();
  expect((await request.get("/projects/cms-renamed-project")).status()).toBe(
    200,
  );
  const oldUrl = await request.get("/projects/cms-integration-project", {
    maxRedirects: 0,
  });
  expect(oldUrl.status()).toBe(308);
  expect(oldUrl.headers().location).toBe("/projects/cms-renamed-project");
  await page
    .getByLabel("Publication status", { exact: true })
    .selectOption("draft");
  await save(page);
  await expect(page.getByText("Project saved.", { exact: true })).toBeVisible();
  expect((await request.get("/projects/cms-renamed-project")).status()).toBe(
    404,
  );
  expect(
    (await request.get("/projects/cms-integration-project")).status(),
  ).toBe(404);
  await page
    .getByLabel("Publication status", { exact: true })
    .selectOption("archived");
  await save(page);
  await expect(page.getByText("Project saved.", { exact: true })).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: `/tmp/portfolio-admin-editor-${testInfo.project.name}.png`,
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "Delete project", exact: true })
    .click();
  await page.getByLabel("Project title", { exact: true }).fill("Wrong title");
  await page
    .getByRole("button", { name: "Permanently delete", exact: true })
    .click();
  await expect(page.locator(".form-error[role=alert]")).toContainText(
    "exact project title",
  );
  await page
    .getByLabel("Project title", { exact: true })
    .fill("CMS integration project");
  await page
    .getByRole("button", { name: "Permanently delete", exact: true })
    .click();
  await expect(page).toHaveURL(/\/admin\/projects\?deleted=1$/);
  await expect(
    page.getByRole("link", { name: "CMS integration project", exact: true }),
  ).toHaveCount(0);
});
test("settings save is real, stale revisions fail, unsaved navigation is protected and logout works", async ({
  page,
  browser,
  request,
}) => {
  await signIn(page);
  await page.goto("/admin/settings");
  const other = await browser.newContext({
    storageState: await page.context().storageState(),
  });
  const stale = await other.newPage();
  await stale.goto("http://127.0.0.1:3102/admin/settings");
  await page
    .getByLabel("Headline", { exact: true })
    .fill("An isolated CMS test headline");
  await page
    .getByLabel("Site identity publication status", { exact: true })
    .selectOption("published");
  await save(page);
  await expect(
    page.getByText("Site settings saved.", { exact: true }),
  ).toBeVisible();
  const publicHome = await request.get("/");
  expect(await publicHome.text()).toContain("An isolated CMS test headline");
  await stale.getByLabel("Headline", { exact: true }).fill("Stale overwrite");
  await stale
    .getByRole("button", { name: "Save changes", exact: true })
    .click();
  await expect(stale.locator(".form-error[role=alert]")).toContainText(
    "another tab",
  );
  expect(await (await request.get("/")).text()).not.toContain(
    "Stale overwrite",
  );
  await page.getByLabel("Headline", { exact: true }).fill("Unsaved text");
  page.once("dialog", (dialog) => void dialog.dismiss());
  await page.getByRole("link", { name: "Overview", exact: true }).click();
  await expect(page).toHaveURL(/\/admin\/settings$/);
  page.once("dialog", (dialog) => void dialog.accept());
  await page
    .getByRole("button", { name: "Reset unsaved changes", exact: true })
    .click();
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await expect(page).toHaveURL(/\/admin\/login$/);
  await page.goto("/admin/projects");
  await expect(page).toHaveURL(/\/admin\/login$/);
  await other.close();
});
test("replayed Server Action requests cannot bypass authorization or a revoked session", async ({
  page,
}) => {
  await signIn(page);
  await page.goto("/admin/projects/new");
  await page.getByLabel("Title", { exact: false }).first().fill("Guard test");
  await page.getByLabel("Slug", { exact: false }).fill("guard-test");
  const posted = page.waitForRequest(
    (req) => req.method() === "POST" && Boolean(req.headers()["next-action"]),
  );
  await save(page);
  const action = await posted;
  await expect(page.getByText("Project saved.", { exact: true })).toBeVisible();
  const savedId = await page.locator("input[name=id]").inputValue();
  expect(savedId).toMatch(/^[a-f0-9-]{36}$/);
  const headers = action.headers();
  const replayHeaders = {
    "next-action": headers["next-action"],
    "content-type": headers["content-type"],
    origin: "http://127.0.0.1:3102",
  };
  const anonymous = await playwrightRequest.newContext();
  const replay = await anonymous.post(action.url(), {
    headers: replayHeaders,
    data: Buffer.from(
      (action.postDataBuffer()?.toString() ?? "").replaceAll(
        "guard-test",
        "blocked-anonymous",
      ),
    ),
  });
  expect(await replay.text()).not.toContain("Project saved.");
  const tokenResponse = await anonymous.post(
    "http://127.0.0.1:54399/auth/v1/token?grant_type=password",
    { data: { email: "member@example.test", password: TEST_PASSWORD } },
  );
  const session: unknown = await tokenResponse.json();
  const cookieName = (await page.context().cookies()).find((cookie) =>
    cookie.name.startsWith("sb-"),
  )?.name;
  expect(cookieName).toBeTruthy();
  const member = await playwrightRequest.newContext({
    extraHTTPHeaders: {
      cookie: `${cookieName}=base64-${Buffer.from(JSON.stringify(session)).toString("base64url")}`,
    },
  });
  const nonadmin = await member.post(action.url(), {
    headers: replayHeaders,
    data: Buffer.from(
      (action.postDataBuffer()?.toString() ?? "").replaceAll(
        "guard-test",
        "blocked-member",
      ),
    ),
  });
  expect(await nonadmin.text()).not.toContain("Project saved.");
  expect(
    await (
      await anonymous.get("http://127.0.0.1:54399/__test/project-count")
    ).json(),
  ).toEqual({ count: 16 });
  await page.request.post("http://127.0.0.1:54399/__test/revoke");
  const revoked = await page.request.post(action.url(), {
    headers: replayHeaders,
    data: Buffer.from(
      (action.postDataBuffer()?.toString() ?? "").replaceAll(
        "guard-test",
        "blocked-revoked",
      ),
    ),
  });
  expect(await revoked.text()).not.toContain("Project saved.");
  await page.goto(`/admin/projects/${savedId}`);
  await expect(page).toHaveURL(/\/admin\/login$/);
  expect(
    await (
      await anonymous.get("http://127.0.0.1:54399/__test/project-count")
    ).json(),
  ).toEqual({ count: 16 });
  await anonymous.dispose();
  await member.dispose();
});
