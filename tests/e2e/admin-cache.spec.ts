import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { login, captureSave } from "../fixtures/admin";
import accounts from "../fixtures/admin-accounts.json";
import { appOrigin } from "../fixtures/app-origin";

test("@admin warm public caches expire precisely on writes, rename and publication withdrawal", async ({
  page,
  browser,
}) => {
  const api = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "",
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
  await api.auth.signInWithPassword(accounts.admin);
  const original = await api
    .from("public_labels")
    .select("value")
    .eq("key", "backProjects")
    .single();
  if (!original.data) throw Error("Missing local label");
  const label = original.data.value;
  const anonymous = await browser.newContext();
  const home = await anonymous.newPage();
  const slug = `cache-test-${Date.now()}`;
  const sitemap = async () =>
    (await anonymous.request.get(`${appOrigin}/sitemap.xml`)).text();
  const summary =
    "Local cache fixture </script><script>window.cmsInjection=1</script>";
  let id = "";
  try {
    await home.goto(appOrigin);
    await login(page);
    await page.goto("/admin/projects/new");
    await page
      .getByLabel("Title (required)", { exact: true })
      .fill("Local cache fixture");
    await page.getByLabel("Slug (required)", { exact: true }).fill(slug);
    await page.getByLabel("Summary", { exact: true }).fill(summary);
    await captureSave(page, "Create project");
    await expect(page).toHaveURL(/\/admin\/projects\/[a-f0-9-]+\?created=1/);
    id = new URL(page.url()).pathname.split("/").at(-1) || "";
    // A private admin preview must never populate an anonymous shared cache.
    const preview = await page.context().newPage();
    await preview.goto(`${appOrigin}/admin/projects/${id}/preview`);
    await expect(
      preview.getByRole("heading", {
        name: "Local cache fixture",
        exact: true,
      }),
    ).toBeVisible();
    await preview.close();
    expect(
      (await anonymous.request.get(`${appOrigin}/projects/${slug}`)).status(),
    ).toBe(404);
    expect(await sitemap()).not.toContain(`/projects/${slug}</loc>`);
    await page.getByLabel("Status", { exact: true }).selectOption("published");
    await page
      .getByLabel("Publication time (UTC)")
      .fill("2026-01-01T00:00:00Z");
    await captureSave(page, "Save project");
    await expect(
      page.getByRole("status").filter({ hasText: "Project saved." }),
    ).toBeVisible();
    expect(await sitemap()).toContain(`/projects/${slug}</loc>`);
    await home.goto(`${appOrigin}/projects/${slug}`);
    await expect(
      home.getByRole("heading", { name: "Local cache fixture", exact: true }),
    ).toBeVisible();
    const graph = JSON.parse(
      await home.locator('script[type="application/ld+json"]').innerText(),
    );
    expect(graph["@graph"][1].description).toBe(summary);
    expect(await home.evaluate(() => "cmsInjection" in window)).toBe(false);
    // A DB-only test probe proves the label group is actually cached.
    const probe = `External label probe ${Date.now()}`;
    expect(
      (
        await api
          .from("public_labels")
          .update({ value: probe })
          .eq("key", "backProjects")
      ).error,
    ).toBeNull();
    await home.reload();
    await expect(
      home.getByRole("link", { name: label, exact: true }),
    ).toBeVisible();
    await page
      .getByLabel("Title (required)", { exact: true })
      .fill("Updated local cache fixture");
    await page
      .getByLabel("Slug (required)", { exact: true })
      .fill(`${slug}-renamed`);
    await captureSave(page, "Save project");
    await expect(
      page.getByRole("status").filter({ hasText: "Project saved." }),
    ).toBeVisible();
    expect(
      (await anonymous.request.get(`${appOrigin}/projects/${slug}`)).status(),
    ).toBe(404);
    await home.goto(`${appOrigin}/projects/${slug}-renamed`);
    await expect(
      home.getByRole("heading", {
        name: "Updated local cache fixture",
        exact: true,
      }),
    ).toBeVisible();
    // Expiring projects must not flush an unrelated label group.
    const renamedMap = await sitemap();
    expect(renamedMap).not.toContain(`/projects/${slug}</loc>`);
    expect(renamedMap).toContain(`/projects/${slug}-renamed</loc>`);
    await expect(
      home.getByRole("link", { name: label, exact: true }),
    ).toBeVisible();
    await page.getByLabel("Status", { exact: true }).selectOption("draft");
    await captureSave(page, "Save project");
    await expect(
      page.getByRole("status").filter({ hasText: "Project saved." }),
    ).toBeVisible();
    expect(
      (
        await anonymous.request.get(`${appOrigin}/projects/${slug}-renamed`)
      ).status(),
    ).toBe(404);
    expect(await (await anonymous.request.get(appOrigin)).text()).not.toContain(
      "Updated local cache fixture",
    );
    expect(await sitemap()).not.toContain(`/projects/${slug}-renamed</loc>`);
    await page.getByLabel("Status", { exact: true }).selectOption("published");
    await captureSave(page, "Save project");
    await expect(
      page.getByRole("status").filter({ hasText: "Project saved." }),
    ).toBeVisible();
    await page.goto("/admin/content/public_labels");
    const form = page
      .locator("details")
      .filter({ has: page.locator('input[name="id"][value="backProjects"]') });
    await form.locator("summary").click();
    await captureSave(page, "Save content", form);
    await expect(
      form.getByRole("status").filter({ hasText: "Content saved." }),
    ).toBeVisible();
    await home.goto(`${appOrigin}/projects/${slug}-renamed`);
    await expect(
      home.getByRole("link", { name: probe, exact: true }),
    ).toBeVisible();
    await form.locator('[name="value"]').fill(label);
    await captureSave(page, "Save content", form);
    await expect(
      form.getByRole("status").filter({ hasText: "Content saved." }),
    ).toBeVisible();
    await page.goto(`/admin/projects/${id}`);
    await page
      .getByLabel("Type the current slug to confirm deletion")
      .fill(`${slug}-renamed`);
    await captureSave(page, "Delete project permanently");
    await expect(page).toHaveURL(/\/admin\/projects\?deleted=1/);
    expect(
      (
        await anonymous.request.get(`${appOrigin}/projects/${slug}-renamed`)
      ).status(),
    ).toBe(404);
    expect(await sitemap()).not.toContain(`/projects/${slug}-renamed</loc>`);
  } finally {
    if (id) await api.from("projects").delete().eq("id", id);
    await api
      .from("public_labels")
      .update({ value: label })
      .eq("key", "backProjects");
    await page.goto("/admin/content/public_labels");
    const form = page
      .locator("details")
      .filter({ has: page.locator('input[name="id"][value="backProjects"]') });
    await form.locator("summary").click();
    await captureSave(page, "Save content", form);
    await anonymous.close();
  }
});
