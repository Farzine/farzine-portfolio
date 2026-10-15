import { appOrigin } from "../fixtures/app-origin";
import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

const sections = [
  "about",
  "education",
  "experience",
  "portfolio",
  "skills",
  "links",
  "contacts",
];

test("all source sections, images and project cards render without private facts or overflow", async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  for (const section of sections) {
    await page.evaluate((key) => {
      window.location.hash = key;
    }, section);
    await expect(page.locator(`#${section}`)).toBeVisible();
    await expect(
      page.locator(`#${section} .section-heading`).first(),
    ).toBeVisible();
    for (const image of await page
      .locator(`#${section} img:not(.skill-logo img)`)
      .all()) {
      await image.scrollIntoViewIfNeeded();
      await expect
        .poll(() =>
          image.evaluate(
            (element: HTMLImageElement) =>
              element.complete && element.naturalWidth > 0,
          ),
        )
        .toBeTruthy();
    }
    await page.evaluate(() => {
      window.scrollTo(0, 0);
      if (document.activeElement instanceof HTMLElement)
        document.activeElement.blur();
    });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      section,
    ).toBeTruthy();
    await page.screenshot({
      path: testInfo.outputPath(`${section}.png`),
      fullPage: true,
      scale: "css",
      animations: "disabled",
    });
  }
  await expect(page.locator(".project-card")).toHaveCount(15);
  await expect(page.locator(".certificate-card")).toHaveCount(9);
  await expect(page.locator(".interest-card")).toHaveCount(8);
  await expect(page.locator(".skill-panel")).toHaveCount(4);
  const html = await page.content();
  for (const value of [
    "02 January 2003",
    "1521781591",
    "Naldanga",
    "PRIVATE_TEST_CANARY",
  ])
    expect(html).not.toContain(value);
  expect(errors).toEqual([]);
});

test("filters, native dialog, Escape and canonical project pages work", async ({
  page,
}) => {
  await page.goto("/#portfolio");
  await page.getByRole("button", { name: "App", exact: true }).click();
  await expect(page.locator(".project-card:visible")).toHaveCount(6);
  await page.getByRole("button", { name: "Web", exact: true }).click();
  await expect(page.locator(".project-card:visible")).toHaveCount(9);
  await page.getByRole("button", { name: "All", exact: true }).click();
  const link = page.getByRole("link", {
    name: "Project details: GSA-SUST website",
    exact: true,
  });
  await link.focus();
  await page.keyboard.press("Enter");
  const dialog = page.getByRole("dialog", {
    name: "GSA-SUST website",
    exact: true,
  });
  await expect(dialog).toBeVisible();
  await expect(
    dialog.getByRole("heading", {
      name: "Gaibandha Students Association Website",
      exact: true,
    }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(link).toBeFocused();
  await link.click();
  await dialog.getByRole("link", { name: "Open project page" }).click();
  await expect(page).toHaveURL("/projects/gsa-sust");
  await expect(
    page.getByRole("heading", {
      name: "Gaibandha Students Association Website",
      level: 1,
    }),
  ).toBeVisible();
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    "https://farzine.vercel.app/projects/gsa-sust",
  );
});

test("private/unknown project routes return 404 and old public detail URLs redirect", async ({
  page,
  request,
}) => {
  for (const slug of ["private-regression-fixture", "does-not-exist"]) {
    const response = await page.goto(`/projects/${slug}`);
    expect(response?.status()).toBe(404);
    await expect(
      page.getByRole("heading", { name: "Page not found" }),
    ).toBeVisible();
    expect(await page.content()).not.toContain("PRIVATE_TEST_CANARY");
  }
  const legacy = await request.get("/projects/dpLearningApp.html", {
    maxRedirects: 0,
  });
  expect(legacy.status()).toBe(308);
  expect(legacy.headers().location).toBe("/projects/dplearningapp");
  expect((await request.get("/legacy/index.html")).status()).toBe(404);
});

test("section navigation and category filtering work without JavaScript", async ({
  browser,
}) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    viewport: { width: 390, height: 844 },
  });
  const page = await context.newPage();
  await page.goto(`${appOrigin}/#about`);
  await expect(page.locator("#about")).toBeVisible();
  await expect(
    page.getByText("Software Development", { exact: true }),
  ).toBeVisible();
  await page.getByLabel("Open navigation").click();
  await page
    .getByRole("link", { name: "Projects", exact: true })
    .filter({ visible: true })
    .click();
  await expect(page.locator("#portfolio")).toBeVisible();
  // A no-JS disclosure remains open until toggled; close it before using page controls.
  await page.getByLabel("Open navigation").click();
  await page.getByRole("button", { name: "App", exact: true }).click();
  await expect(page).toHaveURL(/\/projects\?category=App$/);
  await expect(page.locator(".project-card:visible")).toHaveCount(6);
  await page
    .getByRole("link", {
      name: "Project details: DP-Learning App",
      exact: true,
    })
    .click();
  await expect(page).toHaveURL("/projects/dplearningapp");
  await expect(
    page.getByRole("heading", { level: 1, name: "DP-Learning App" }),
  ).toBeVisible();
  await context.close();
});

test("reduced motion and mobile menu keyboard dismissal remain usable", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const menu = page.getByLabel("Open navigation");
  if (await menu.isVisible()) {
    await menu.focus();
    await page.keyboard.press("Enter");
    await expect(page.locator(".mobile-navigation")).toHaveAttribute(
      "open",
      "",
    );
    await page.keyboard.press("Escape");
    await expect(page.locator(".mobile-navigation")).not.toHaveAttribute(
      "open",
      "",
    );
    await expect(page.getByLabel("Open navigation")).toBeFocused();
  }
  await page.goto("/#portfolio");
  expect(
    await page
      .locator(".image-overlay")
      .first()
      .evaluate((element) => getComputedStyle(element).transitionDuration),
  ).toBe("0s");
});

test("real anonymous Data API hides draft/private data and rejects writes", async () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  test.skip(
    !url || !key,
    "Requires the full local Supabase integration configuration.",
  );
  const client = createClient(url || "", key || "", {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const projects = await client.from("projects").select("slug");
  expect(projects.error).toBeNull();
  expect(projects.data).toHaveLength(15);
  expect(
    projects.data?.some(
      (project) => project.slug === "private-regression-fixture",
    ),
  ).toBe(false);
  const facts = await client.from("profile_facts").select("value");
  expect(facts.error).toBeNull();
  expect(facts.data).toEqual([]);
  const write = await client.from("projects").insert({
    title: "FORBIDDEN_WRITE_CANARY",
    slug: "forbidden-write-canary",
  });
  expect(write.error).not.toBeNull();
});
