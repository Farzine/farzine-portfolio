import { test, expect, request as playwrightRequest } from "@playwright/test";
import { readFileSync } from "node:fs";
import { signIn, save } from "./workflow";
import { TEST_PASSWORD } from "../helpers/supabase-fixture";
test.beforeEach(async ({ request }) => {
  expect((await request.post("http://127.0.0.1:54399/__test/reset")).ok()).toBe(
    true,
  );
});
async function upload(
  page: import("@playwright/test").Page,
  name: string,
  isPublic: boolean,
) {
  await page.goto("/admin/media");
  await page.locator("#file").setInputFiles({
    name: "cover.png",
    mimeType: "image/png",
    buffer: readFileSync("public/assets/img/project/gsa-sust.png"),
  });
  await page.locator("#alt_text").fill(name);
  await page.locator("#is_public").setChecked(isPublic);
  await page.getByRole("button", { name: "Upload file", exact: true }).click();
  await expect(
    page.getByText("File uploaded and registered in the media library.", {
      exact: true,
    }),
  ).toBeVisible();
}
test("uploads validate, private files stay private, referenced public assets cannot be deleted", async ({
  page,
  request,
}) => {
  await signIn(page);
  await page.goto("/admin/media");
  await page.locator("#file").setInputFiles({
    name: "unsafe.png",
    mimeType: "image/png",
    buffer: Buffer.from('<svg onload="alert(1)"/>'),
  });
  await page.locator("#alt_text").fill("Rejected image");
  await page.getByRole("button", { name: "Upload file", exact: true }).click();
  await expect(page.locator(".form-error[role=alert]")).toBeVisible();
  await upload(page, "Private fixture image", false);
  const privateArticle = page.getByRole("article").filter({
    has: page.getByRole("heading", {
      name: "Private fixture image",
      exact: true,
    }),
  });
  const download = privateArticle.getByRole("link", {
    name: "Download private asset",
    exact: false,
  });
  const privatePath = await download.getAttribute("href");
  expect(privatePath).toBeTruthy();
  expect(
    (await request.get(privatePath ?? "", { maxRedirects: 0 })).status(),
  ).toBe(403);
  const privateResponse = await page.request.get(privatePath ?? "", {
    maxRedirects: 0,
  });
  expect(privateResponse.status()).toBe(307);
  expect(privateResponse.headers()["cache-control"]).toContain("no-store");
  const signed = privateResponse.headers().location;
  expect((await request.get(signed)).status()).toBe(200);
  await upload(page, "Public fixture image", true);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: `/tmp/portfolio-media-${test.info().project.name}.png`,
    fullPage: true,
  });
  const publicArticle = page.getByRole("article").filter({
    has: page.getByRole("heading", {
      name: "Public fixture image",
      exact: true,
    }),
  });
  const url = await publicArticle
    .getByRole("link", { name: "Open asset", exact: false })
    .getAttribute("href");
  expect(url).toMatch(/\.webp$/);
  expect((await request.get(url ?? "")).status()).toBe(200);
  await page.goto("/admin/projects/new");
  await page.locator("#title").fill("Fixture media project");
  await page.locator("#slug").fill("fixture-media-project");
  await page.locator("#cover_image").selectOption(url ?? "");
  await page.locator("#cover_alt").fill("Fixture cover");
  await save(page);
  await expect(page.getByText("Project saved.", { exact: true })).toBeVisible();
  const id = await page.locator("input[name=id]").inputValue();
  await page.goto("/admin/media");
  let article = page.getByRole("article").filter({
    has: page.getByRole("heading", {
      name: "Public fixture image",
      exact: true,
    }),
  });
  await article
    .getByRole("button", { name: "Delete item", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByLabel("Item title", { exact: true })
    .fill("Public fixture image");
  await page
    .getByRole("button", { name: "Permanently delete", exact: true })
    .click();
  await expect(page.locator(".form-error[role=alert]")).toContainText(
    "still referenced",
  );
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  await page.goto(`/admin/projects/${id}`);
  await page.locator("#cover_image").selectOption("");
  await save(page);
  await expect(page.getByText("Project saved.", { exact: true })).toBeVisible();
  await page.goto("/admin/media");
  article = page.getByRole("article").filter({
    has: page.getByRole("heading", {
      name: "Public fixture image",
      exact: true,
    }),
  });
  await article
    .getByRole("button", { name: "Delete item", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByLabel("Item title", { exact: true })
    .fill("Public fixture image");
  await page
    .getByRole("button", { name: "Permanently delete", exact: true })
    .click();
  await expect(page).toHaveURL(/\/admin\/media\?deleted=1$/);
  expect((await request.get(url ?? "")).status()).toBe(404);
});
test("anonymous and non-admin sessions cannot invoke the loaded upload action or upload directly", async ({
  page,
}) => {
  await signIn(page);
  await upload(page, "Owner upload", false);
  await page.goto("/admin/media");
  await page.context().clearCookies();
  await page.locator("#file").setInputFiles({
    name: "fixture.png",
    mimeType: "image/png",
    buffer: readFileSync("public/assets/img/project/gsa-sust.png"),
  });
  await page.locator("#alt_text").fill("Blocked anonymous upload");
  await page.getByRole("button", { name: "Upload file", exact: true }).click();
  await expect(page.locator(".form-error[role=alert]")).toContainText(
    "session",
  );
  await signIn(page);
  await page.goto("/admin/media");
  const cookieName = (await page.context().cookies()).find((cookie) =>
    cookie.name.startsWith("sb-"),
  )?.name;
  expect(cookieName).toBeTruthy();
  const anonymous = await playwrightRequest.newContext();
  const tokenResponse = await anonymous.post(
    "http://127.0.0.1:54399/auth/v1/token?grant_type=password",
    { data: { email: "member@example.test", password: TEST_PASSWORD } },
  );
  const session: unknown = await tokenResponse.json();
  await page.context().clearCookies();
  await page.context().addCookies([
    {
      name: cookieName ?? "",
      value: `base64-${Buffer.from(JSON.stringify(session)).toString("base64url")}`,
      url: "http://127.0.0.1:3102",
    },
  ]);
  await page.locator("#file").setInputFiles({
    name: "fixture.png",
    mimeType: "image/png",
    buffer: readFileSync("public/assets/img/project/gsa-sust.png"),
  });
  await page.locator("#alt_text").fill("Blocked member upload");
  await page.getByRole("button", { name: "Upload file", exact: true }).click();
  await expect(page.locator(".form-error[role=alert]")).toContainText(
    "session",
  );
  const token =
    typeof session === "object" && session && "access_token" in session
      ? String(session.access_token)
      : "";
  const path =
    "portfolio-public/00000000-0000-4000-8000-000000000000/00000000-0000-4000-8000-000000000003.png";
  for (const authorization of ["sb_publishable_test-only", `Bearer ${token}`])
    expect(
      (
        await anonymous.post(
          `http://127.0.0.1:54399/storage/v1/object/${path}`,
          { headers: { authorization }, data: "Forbidden" },
        )
      ).status(),
    ).toBe(403);
  await signIn(page);
  await page.goto("/admin/media");
  await expect(page.getByRole("article")).toHaveCount(1);
  await anonymous.dispose();
});
test("asset descriptions and project gallery captions can be edited and published", async ({
  page,
  request,
}) => {
  await signIn(page);
  await upload(page, "Gallery asset", true);
  const article = page.getByRole("article").first();
  await article
    .getByLabel("Asset description", { exact: false })
    .fill("Edited gallery asset");
  await article
    .getByRole("button", { name: "Save changes", exact: true })
    .click();
  await expect(
    article.getByText("Asset description saved.", { exact: true }),
  ).toBeVisible();
  await page.goto("/admin/projects/new");
  await page.locator("#title").fill("Fixture gallery project");
  await page.locator("#slug").fill("fixture-gallery-project");
  await page.locator("#summary").fill("Fixture gallery summary.");
  await page.locator("#status").selectOption("published");
  await save(page);
  await expect(page.getByText("Project saved.", { exact: true })).toBeVisible();
  const id = await page.locator("input[name=id]").inputValue();
  await page.goto("/admin/content/project_media/new");
  await page.locator("#project_id").selectOption(id);
  await page
    .locator("#media_id")
    .selectOption({ label: "Edited gallery asset" });
  await page.locator("#caption").fill("Fixture screenshot caption");
  await save(page);
  await expect(page.getByText("Item saved.", { exact: true })).toBeVisible();
  const galleryId = await page.locator("input[name=id]").inputValue();
  let html = await (
    await request.get("/projects/fixture-gallery-project")
  ).text();
  expect(html).toContain("Fixture screenshot caption");
  expect(html).toContain("Edited gallery asset");
  await page.goto("/projects/fixture-gallery-project");
  await expect
    .poll(() =>
      page
        .locator(".project-gallery img")
        .first()
        .evaluate(
          (image) =>
            image instanceof HTMLImageElement &&
            image.complete &&
            image.naturalWidth > 0,
        ),
    )
    .toBe(true);
  await page.goto(`/admin/content/project_media/${galleryId}`);
  await page.locator("#caption").fill("Edited screenshot caption");
  await save(page);
  await expect(page.getByText("Item saved.", { exact: true })).toBeVisible();
  html = await (await request.get("/projects/fixture-gallery-project")).text();
  expect(html).toContain("Edited screenshot caption");
  await page.reload();
  await page.getByRole("button", { name: "Delete item", exact: true }).click();
  await page
    .getByRole("dialog")
    .getByLabel("Item title", { exact: true })
    .fill("Edited screenshot caption");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Permanently delete", exact: true })
    .click();
  await expect(page).toHaveURL(/deleted=1$/);
  expect(
    await (await request.get("/projects/fixture-gallery-project")).text(),
  ).not.toContain("Edited screenshot caption");
});
