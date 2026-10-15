import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";
import accounts from "../fixtures/admin-accounts.json";
import { appOrigin as origin } from "../fixtures/app-origin";
import {
  login,
  setSession,
  captureSave,
  assertDenied,
} from "../fixtures/admin";
import type { CollectionName } from "../../lib/validations/collections";
const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "";
test.describe.configure({ mode: "serial" });
test.use({ actionTimeout: 10000, navigationTimeout: 15000 });
const cases: {
  name: Exclude<
    CollectionName,
    "section_settings" | "public_labels" | "navigation_items"
  >;
  title: string;
  extra: Record<string, string>;
}[] = [
  {
    name: "profile_facts",
    title: "label",
    extra: { value: "Private local regression value" },
  },
  {
    name: "experiences",
    title: "organization",
    extra: { role: "Local test role" },
  },
  { name: "education", title: "qualification", extra: {} },
  { name: "certifications", title: "name", extra: {} },
  { name: "achievements", title: "title", extra: {} },
  { name: "skill_groups", title: "name", extra: {} },
  { name: "skills", title: "name", extra: {} },
  { name: "interests", title: "name", extra: {} },
  {
    name: "social_links",
    title: "label",
    extra: { url: "https://example.com/local-fixture" },
  },
  {
    name: "document_links",
    title: "title",
    extra: { url: "https://example.com/local-fixture.pdf" },
  },
];
test("@admin collection CRUD covers all entities, explicit visibility and shared-action denials", async ({
  page,
  browser,
}) => {
  test.setTimeout(90000);
  const api = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const publicApi = createClient(url, key, { auth: { persistSession: false } });
  await api.auth.signInWithPassword(accounts.admin);
  const anonymous = await browser.newContext(),
    nonAdmin = await browser.newContext();
  await setSession(nonAdmin, "nonAdmin");
  const cleanup: { name: (typeof cases)[number]["name"]; id: string }[] = [];
  try {
    await login(page);
    for (const item of cases) {
      await page.goto(`/admin/content/${item.name}`);
      const form = page.locator("form").filter({
        has: page.getByRole("button", {
          name: "Create content",
          exact: true,
        }),
      });
      const title = `Local ${item.name} ${Date.now()}`;
      await form.locator(`[name="${item.title}"]`).fill(title);
      for (const [field, value] of Object.entries(item.extra))
        await form.locator(`[name="${field}"]`).fill(value);
      if (item.name === "skills")
        await form.locator('[name="group_id"]').selectOption({ index: 1 });
      const create = await captureSave(page, "Create content", form);
      await expect(form.getByRole("status")).toHaveText("Content saved.");
      await assertDenied(create, anonymous, nonAdmin);
      const rows = await api.from(item.name).select("*").eq(item.title, title);
      expect(rows.error).toBeNull();
      expect(rows.data).toHaveLength(1);
      const row = rows.data?.[0];
      if (!row) throw new Error("Missing created row.");
      cleanup.push({ name: item.name, id: row.id });
      expect(
        (await publicApi.from(item.name).select("id").eq("id", row.id)).data,
      ).toHaveLength(0);
      const editor = page
        .locator("details")
        .filter({ has: page.locator(`input[name="id"][value="${row.id}"]`) });
      await editor.locator("summary").click();
      const saveForm = editor.locator("form").filter({
        has: page.getByRole("button", { name: "Save content", exact: true }),
      });
      await saveForm.locator('[name="is_visible"]').check();
      await saveForm.locator('[name="sort_order"]').fill("9");
      const save = await captureSave(page, "Save content", saveForm);
      await expect(saveForm.getByRole("status")).toHaveText("Content saved.");
      await assertDenied(save, anonymous, nonAdmin);
      expect(
        (await publicApi.from(item.name).select("id").eq("id", row.id)).data,
      ).toHaveLength(1);
      const home = await anonymous.request.get(origin);
      expect(await home.text()).toContain(
        item.name === "profile_facts"
          ? "Private local regression value"
          : title,
      );
      await saveForm.locator('[name="is_visible"]').uncheck();
      await captureSave(page, "Save content", saveForm);
      await expect(saveForm.getByRole("status")).toHaveText("Content saved.");
      expect(
        (await publicApi.from(item.name).select("id").eq("id", row.id)).data,
      ).toHaveLength(0);
      const deleteForm = editor.locator("form").filter({
        has: page.getByRole("button", {
          name: "Delete item permanently",
          exact: true,
        }),
      });
      await deleteForm.locator('[name="confirmation"]').check();
      const deletion = await captureSave(
        page,
        "Delete item permanently",
        deleteForm,
      );
      await expect(editor).toHaveCount(0);
      await assertDenied(deletion, anonymous, nonAdmin);
    }
  } finally {
    for (const row of cleanup.reverse())
      await api.from(row.name).delete().eq("id", row.id);
    await anonymous.close();
    await nonAdmin.close();
  }
});

test("@admin section/navigation ordering, visibility, editable labels and invalid content", async ({
  page,
  browser,
}) => {
  const api = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  await api.auth.signInWithPassword(accounts.admin);
  const sections = await api
    .from("section_settings")
    .select("*")
    .eq("key", "contacts")
    .single();
  const nav = await api
    .from("navigation_items")
    .select("*")
    .eq("section_key", "contacts")
    .single();
  const label = await api
    .from("public_labels")
    .select("*")
    .eq("key", "technology")
    .single();
  if (!sections.data || !nav.data || !label.data)
    throw new Error("Missing local settings.");
  const publicContext = await browser.newContext();
  const navigationFixture = `Local navigation fixture ${Date.now()}`;
  try {
    await login(page);
    await page.goto("/admin/content/section_settings");
    const editor = page
      .locator("details")
      .filter({ has: page.locator('input[name="id"][value="contacts"]') });
    await editor.locator("summary").click();
    await editor.locator('[name="title"]').fill("Local contact heading");
    await editor.locator('[name="sort_order"]').fill("1");
    await captureSave(page, "Save content", editor);
    const home = await publicContext.newPage();
    await home.goto(`${origin}/#contacts`);
    await expect(
      home.getByRole("heading", { name: "Local contact heading", exact: true }),
    ).toBeVisible();
    await editor.locator('[name="is_visible"]').uncheck();
    await captureSave(page, "Save content", editor);
    await home.reload();
    await expect(home.locator("#contacts")).toHaveCount(0);
    await page.goto("/admin/content/navigation_items");
    const navigation = page.locator("details").filter({
      has: page.locator(`input[name="id"][value="${nav.data.id}"]`),
    });
    await navigation.locator("summary").click();
    await navigation.locator('[name="label"]').fill("Local navigation label");
    await navigation.locator('[name="sort_order"]').fill("0");
    await captureSave(page, "Save content", navigation);
    expect(
      (
        await api
          .from("navigation_items")
          .select("sort_order")
          .eq("id", nav.data.id)
          .single()
      ).data?.sort_order,
    ).toBe(0);
    await navigation
      .getByLabel("Confirm permanent deletion", { exact: false })
      .check();
    await captureSave(page, "Delete item permanently", navigation);
    await expect(navigation).toHaveCount(0);
    const newNavigation = page.locator("form").filter({
      has: page.getByRole("button", { name: "Create content", exact: true }),
    });
    await newNavigation.locator('[name="label"]').fill(navigationFixture);
    await newNavigation
      .locator('[name="section_key"]')
      .selectOption("contacts");
    await newNavigation.locator('[name="is_visible"]').check();
    await captureSave(page, "Create content", newNavigation);
    const createdNavigation = await api
      .from("navigation_items")
      .select("id")
      .eq("label", navigationFixture)
      .single();
    if (!createdNavigation.data) throw new Error("Navigation was not created.");
    const createdEditor = page.locator("details").filter({
      has: page.locator(
        `input[name="id"][value="${createdNavigation.data.id}"]`,
      ),
    });
    await createdEditor.locator("summary").click();
    await createdEditor
      .getByLabel("Confirm permanent deletion", { exact: false })
      .check();
    await captureSave(page, "Delete item permanently", createdEditor);
    await expect(createdEditor).toHaveCount(0);
    await page.goto("/admin/content/public_labels");
    const copy = page
      .locator("details")
      .filter({ has: page.locator('input[name="id"][value="technology"]') });
    await copy.locator("summary").click();
    await copy.locator('[name="value"]').fill("Local technology label");
    await captureSave(page, "Save content", copy);
    await home.goto(`${origin}/projects/gsa-sust`);
    await expect(
      home.getByText("Local technology label", { exact: true }),
    ).toBeVisible();
    await page.goto("/admin/content/social_links");
    const create = page.locator("form").filter({
      has: page.getByRole("button", { name: "Create content", exact: true }),
    });
    await create.locator('[name="label"]').fill("Invalid local link");
    await create.locator('[name="url"]').fill("javascript:alert(1)");
    await captureSave(page, "Create content", create);
    await expect(create.locator('[aria-invalid="true"]')).toHaveCount(1);
    expect(
      (
        await api
          .from("social_links")
          .select("id")
          .eq("label", "Invalid local link")
      ).data,
    ).toHaveLength(0);
  } finally {
    await api.from("navigation_items").delete().eq("label", navigationFixture);
    const {
      created_at: _created,
      updated_at: _updated,
      ...section
    } = sections.data;
    await api.from("section_settings").update(section).eq("key", section.key);
    const {
      created_at: _createdNav,
      updated_at: _updatedNav,
      ...navigation
    } = nav.data;
    await api.from("navigation_items").upsert(navigation);
    await api
      .from("public_labels")
      .update({ value: label.data.value })
      .eq("key", "technology");
    // Direct fixture restoration bypasses Next invalidation; save through the CMS too.
    for (const [name, id] of [
      ["section_settings", "contacts"],
      ["navigation_items", nav.data.id],
      ["public_labels", "technology"],
    ]) {
      await page.goto(`/admin/content/${name}`);
      const restored = page
        .locator("details")
        .filter({ has: page.locator(`input[name="id"][value="${id}"]`) });
      await restored.locator("summary").click();
      await captureSave(page, "Save content", restored);
      await expect(
        restored.getByRole("status").filter({ hasText: "Content saved." }),
      ).toBeVisible();
    }
    await publicContext.close();
  }
});

test("@admin real media validation, private bytes, promotion, references and cleanup", async ({
  page,
  browser,
}) => {
  test.setTimeout(60000);
  const api = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  await api.auth.signInWithPassword(accounts.admin);
  const anonymous = await browser.newContext(),
    nonAdmin = await browser.newContext();
  await setSession(nonAdmin, "nonAdmin");
  const ids: string[] = [];
  let documentId = "";
  let previewProjectId = "";
  const image = await sharp({
    create: { width: 120, height: 80, channels: 3, background: "#09203a" },
  })
    .png()
    .toBuffer();
  const label = `Local media ${Date.now()}`;
  try {
    for (const context of [anonymous, nonAdmin]) {
      const denied = await context.request.post(
        `${origin}/admin/media/upload`,
        {
          headers: { origin },
          multipart: {
            label,
            alt_text: "",
            visibility: "private",
            file: { name: "fixture.png", mimeType: "image/png", buffer: image },
          },
        },
      );
      expect(denied.status()).toBe(context === anonymous ? 401 : 403);
    }
    await login(page);
    await page.goto("/admin/media");
    await expect(
      page.getByRole("heading", { name: "Media library", exact: true }),
    ).toBeVisible();
    await page.setViewportSize({ width: 390, height: 844 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: "test-results/admin-mobile-media.png",
      animations: "disabled",
    });
    const upload = page.locator("form").filter({
      has: page.getByRole("button", { name: "Upload file", exact: true }),
    });
    await upload.locator('[name="label"]').fill(label);
    await upload.locator('[name="alt_text"]').fill("Local test image");
    await upload.locator('[name="file"]').setInputFiles({
      name: "spoof.png",
      mimeType: "image/png",
      buffer: Buffer.from("<svg><script/></svg>"),
    });
    await upload
      .getByRole("button", { name: "Upload file", exact: true })
      .click();
    await expect(upload.getByRole("status")).toContainText(
      "not a supported raster",
    );
    await upload.locator('[name="file"]').setInputFiles({
      name: "fixture.png",
      mimeType: "image/png",
      buffer: image,
    });
    await upload
      .getByRole("button", { name: "Upload file", exact: true })
      .click();
    await expect(upload.getByRole("status")).toHaveText(
      "File uploaded and registered.",
    );
    const first = await api
      .from("media_assets")
      .select("*")
      .eq("label", label)
      .single();
    if (!first.data) throw new Error("Upload not registered.");
    ids.push(first.data.id);
    expect(first.data.is_public).toBe(false);
    expect(first.data.mime_type).toBe("image/webp");
    expect(
      (
        await anonymous.request.get(
          `${origin}/admin/media/${first.data.id}/file`,
        )
      ).status(),
    ).toBe(401);
    expect(
      (
        await nonAdmin.request.get(
          `${origin}/admin/media/${first.data.id}/file`,
        )
      ).status(),
    ).toBe(403);
    expect(
      (
        await page
          .context()
          .request.get(`${origin}/admin/media/${first.data.id}/file`)
      ).headers()["cache-control"],
    ).toContain("no-store");
    const privateBytes = await anonymous.request.get(
      `${url}/storage/v1/object/public/portfolio-private/${first.data.object_path}`,
    );
    expect(privateBytes.status()).toBeGreaterThanOrEqual(400);
    const asset = page.locator(`[data-asset-id="${first.data.id}"]`);
    const draft = await api
      .from("projects")
      .insert({
        title: "Private media preview fixture",
        slug: `private-media-preview-${Date.now()}`,
        cover_media_id: first.data.id,
      })
      .select("id")
      .single();
    if (!draft.data) throw new Error("Preview fixture missing.");
    previewProjectId = draft.data.id;
    await api.from("project_media").insert({
      project_id: previewProjectId,
      media_id: first.data.id,
      caption: "Private gallery preview",
    });
    const preview = await page.context().newPage();
    await preview.goto(`${origin}/admin/projects/${previewProjectId}/preview`);
    await expect(
      preview.getByRole("heading", {
        name: "Private media preview fixture",
        exact: true,
      }),
    ).toBeVisible();
    await expect(
      preview.locator(`img[src="/admin/media/${first.data.id}/file"]`),
    ).toHaveCount(2);
    await expect
      .poll(() =>
        preview
          .locator("img")
          .evaluateAll((images) =>
            images.every(
              (image) =>
                image instanceof HTMLImageElement &&
                image.complete &&
                image.naturalWidth > 0,
            ),
          ),
      )
      .toBe(true);
    await preview.close();
    await api.from("projects").delete().eq("id", previewProjectId);
    previewProjectId = "";
    await asset.locator("summary").click();
    await expect(asset.locator("img")).toBeVisible();
    await asset.locator('[name="confirmation"]').first().check();
    const promotion = await captureSave(page, "Create public copy", asset);
    await assertDenied(promotion, anonymous, nonAdmin);
    const published = await api
      .from("media_assets")
      .select("*")
      .eq("label", `${label} (public copy)`)
      .single();
    if (!published.data) throw new Error("Public copy missing.");
    ids.push(published.data.id);
    const publicBytes = await anonymous.request.get(
      `${url}/storage/v1/object/public/portfolio-public/${published.data.object_path}`,
    );
    expect(publicBytes.status()).toBe(200);
    const doc = await api
      .from("document_links")
      .insert({
        title: "Local media reference",
        media_id: published.data.id,
        is_visible: false,
      })
      .select("id")
      .single();
    if (!doc.data) throw new Error("Missing reference.");
    documentId = doc.data.id;
    const copy = page.locator(`[data-asset-id="${published.data.id}"]`);
    await copy.locator("summary").click();
    await copy
      .getByLabel("Label (required)", { exact: true })
      .fill(`${label} edited`);
    const edit = await captureSave(page, "Save media description", copy);
    await assertDenied(edit, anonymous, nonAdmin);
    await copy
      .getByLabel("Confirm permanent media removal", { exact: false })
      .check();
    await captureSave(page, "Delete media", copy);
    await expect(
      copy.getByRole("status").filter({ hasText: "still in use" }),
    ).toBeVisible();
    expect(
      (
        await anonymous.request.get(
          `${url}/storage/v1/object/public/portfolio-public/${published.data.object_path}`,
        )
      ).status(),
    ).toBe(200);
    await api.from("document_links").delete().eq("id", documentId);
    documentId = "";
    await page.reload();
    const current = page.locator(`[data-asset-id="${published.data.id}"]`);
    await current.locator("summary").click();
    await current
      .getByLabel("Confirm permanent media removal", { exact: false })
      .check();
    const deletion = await captureSave(page, "Delete media", current);
    await assertDenied(deletion, anonymous, nonAdmin);
    await expect(current).toHaveCount(0);
    expect(
      (
        await anonymous.request.get(
          `${url}/storage/v1/object/public/portfolio-public/${published.data.object_path}`,
        )
      ).status(),
    ).toBeGreaterThanOrEqual(400);
    const foreign = await page
      .context()
      .request.post(`${origin}/admin/media/upload`, {
        headers: { origin: "https://attacker.invalid" },
        multipart: {
          label,
          visibility: "private",
          alt_text: "",
          file: { name: "fixture.png", mimeType: "image/png", buffer: image },
        },
      });
    expect(foreign.status()).toBe(403);
    const pdf = Buffer.from(
      "%PDF-1.7\n1 0 obj\n<< /Type /Catalog >>\nendobj\n%%EOF\n",
    );
    const pdfUpload = await page
      .context()
      .request.post(`${origin}/admin/media/upload`, {
        headers: { origin },
        multipart: {
          label: `${label} PDF`,
          alt_text: "",
          visibility: "private",
          file: {
            name: "resume.pdf",
            mimeType: "application/pdf",
            buffer: pdf,
          },
        },
      });
    expect(pdfUpload.status()).toBe(201);
    const result: unknown = await pdfUpload.json();
    if (
      !result ||
      typeof result !== "object" ||
      !("id" in result) ||
      typeof result.id !== "string"
    )
      throw new Error("Invalid document response.");
    ids.push(result.id);
    const downloaded = await page
      .context()
      .request.get(`${origin}/admin/media/${result.id}/file`);
    expect(downloaded.status()).toBe(200);
    expect(downloaded.headers()["content-disposition"]).toContain("attachment");
    expect(downloaded.headers()["x-content-type-options"]).toBe("nosniff");
    expect(await downloaded.body()).toEqual(pdf);
    await api
      .from("media_assets")
      .update({ pending_delete: true })
      .eq("id", first.data.id);
    await page.reload();
    const pending = page.locator(`[data-asset-id="${first.data.id}"]`);
    await pending.locator("summary").click();
    await pending
      .getByLabel("Confirm permanent media removal", { exact: false })
      .check();
    await captureSave(page, "Retry media cleanup", pending);
    await expect(pending).toHaveCount(0);
  } finally {
    if (previewProjectId)
      await api.from("projects").delete().eq("id", previewProjectId);
    if (documentId)
      await api.from("document_links").delete().eq("id", documentId);
    for (const id of ids) {
      const row = await api
        .from("media_assets")
        .update({ pending_delete: true })
        .eq("id", id)
        .select("bucket,object_path")
        .maybeSingle();
      if (row.data?.bucket && row.data.object_path)
        await api.storage.from(row.data.bucket).remove([row.data.object_path]);
      await api.from("media_assets").delete().eq("id", id);
    }
    await anonymous.close();
    await nonAdmin.close();
  }
});
