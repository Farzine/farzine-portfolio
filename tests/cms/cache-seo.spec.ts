import { test, expect } from "@playwright/test";
import { signIn, save } from "./workflow";
test.beforeEach(async ({ request }) => {
  expect((await request.post("http://127.0.0.1:54399/__test/reset")).ok()).toBe(
    true,
  );
});
test("public reads cache independently, mutations expire immediately and owner data never enters public caches", async ({
  page,
  request,
}) => {
  const stats = async (): Promise<Record<string, number>> =>
    (await request.get("http://127.0.0.1:54399/__test/requests")).json();
  await signIn(page);
  await page.goto("/admin/projects/new");
  await page.locator("#title").fill("Fixture cache project");
  await page.locator("#slug").fill("fixture-cache-project");
  await page.locator("#summary").fill("Public fixture summary.");
  await page.locator("#status").selectOption("published");
  await save(page);
  await expect(page.getByText("Project saved.", { exact: true })).toBeVisible();
  const id = await page.locator("input[name=id]").inputValue();
  const first = await request.get("/projects/fixture-cache-project");
  expect(first.status()).toBe(200);
  const before = await stats();
  expect(before["anon:GET:projects"]).toBeGreaterThan(0);
  const second = await request.get("/projects/fixture-cache-project");
  expect(second.status()).toBe(200);
  expect((await stats())["anon:GET:projects"]).toBe(
    before["anon:GET:projects"],
  );
  expect(first.headers()["content-security-policy"]).toContain("'nonce-");
  expect(first.headers()["content-security-policy"]).not.toBe(
    second.headers()["content-security-policy"],
  );
  expect(await (await request.get("/sitemap.xml")).text()).toContain(
    "/projects/fixture-cache-project",
  );
  await page.goto(`/admin/projects/${id}`);
  await page.locator("#summary").fill("Fresh fixture summary.");
  await save(page);
  await expect(page.getByText("Project saved.", { exact: true })).toBeVisible();
  expect(
    await (await request.get("/projects/fixture-cache-project")).text(),
  ).toContain("Fresh fixture summary.");
  expect((await stats())["anon:GET:projects"]).toBeGreaterThan(
    before["anon:GET:projects"],
  );
  await page.locator("#status").selectOption("draft");
  await save(page);
  await expect(page.getByText("Project saved.", { exact: true })).toBeVisible();
  expect((await request.get("/projects/fixture-cache-project")).status()).toBe(
    404,
  );
  expect(
    (await page.request.get("/projects/fixture-cache-project")).status(),
  ).toBe(404);
  expect(await (await request.get("/sitemap.xml")).text()).not.toContain(
    "/projects/fixture-cache-project",
  );
  const privateBefore = await stats();
  const preview = await page.request.get(`/admin/projects/${id}/preview`);
  expect(preview.status()).toBe(200);
  expect(preview.headers()["cache-control"]).toContain("no-store");
  expect(await preview.text()).toContain("Fixture cache project");
  await page.request.get(`/admin/projects/${id}/preview`);
  expect((await stats())["owner:GET:projects"]).toBeGreaterThan(
    privateBefore["owner:GET:projects"],
  );
  expect(
    await (await request.get(`/admin/projects/${id}/preview`)).text(),
  ).not.toContain("Fresh fixture summary.");
});
test("editable metadata, JSON-LD escaping, robots and CSP are consistent with publication", async ({
  page,
  request,
}) => {
  await signIn(page);
  await page.goto("/admin/settings");
  await page.locator("#name").fill("Fixture owner");
  await page
    .locator("#summary")
    .fill("Profile </script><script>window.__bad=true</script> text.");
  await page.locator("#seo_title").fill("Fixture search title");
  await page.locator("#seo_description").fill("Fixture search description");
  await page.locator("#favicon_image").selectOption("/assets/img/profile.png");
  await page
    .locator("#social_preview_image")
    .selectOption("/assets/img/project/gsa-sust.png");
  await page.locator("#status").selectOption("published");
  await save(page);
  await expect(
    page.getByText("Site settings saved.", { exact: true }),
  ).toBeVisible();
  const home = await request.get("/");
  const html = await home.text();
  expect(html).toContain("Fixture search title");
  expect(html).toContain("Fixture search description");
  expect(html).not.toContain("<script>window.__bad=true</script>");
  const policy = home.headers()["content-security-policy"];
  const nonce = /nonce-([^']+)/.exec(policy)?.[1];
  expect(nonce).toBeTruthy();
  expect(html).toContain(`nonce="${nonce}"`);
  expect(policy).toContain("frame-ancestors 'none'");
  await page.goto("/");
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
    "content",
    "http://127.0.0.1:3102/assets/img/project/gsa-sust.png",
  );
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    "http://127.0.0.1:3102",
  );
  await expect(page.locator('link[rel="icon"]')).toHaveAttribute(
    "href",
    "/assets/img/profile.png",
  );
  expect(await page.evaluate(() => Reflect.has(window, "__bad"))).toBe(false);
  const person = JSON.parse(
    (await page.locator('script[type="application/ld+json"]').textContent()) ??
      "{}",
  );
  expect(person.name).toBe("Fixture owner");
  expect(person["@type"]).toBe("Person");
  const robots = await (await request.get("/robots.txt")).text();
  expect(robots).toContain("Disallow: /admin");
  const sitemap = await (await request.get("/sitemap.xml")).text();
  expect(sitemap).not.toContain("farm-ai");
  expect(sitemap).not.toContain("/admin");
});
