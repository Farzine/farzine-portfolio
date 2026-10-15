import { test, expect } from "@playwright/test";
test("production cannot serve development seed or private fields with demo flag enabled", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "A profile",
  );
  await expect(
    page.getByText("Portfolio content has not been published yet."),
  ).toBeVisible();
  const html = await page.content();
  for (const value of [
    "Development preview",
    "1521781591",
    "02 January 2003",
    "farzine07@student.sust.edu",
  ])
    expect(html).not.toContain(value);
  await page.goto("/projects");
  await expect(page.locator(".project-card")).toHaveCount(0);
  const response = await page.goto("/projects/farm-ai");
  expect(response?.status()).toBe(404);
});

test("production CSP uses fresh nonces, protects private routes and contains no fixture endpoints", async ({
  page,
  request,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  const first = await request.get("/");
  const second = await request.get("/");
  const policy = first.headers()["content-security-policy"];
  expect(policy).toContain("'strict-dynamic'");
  expect(policy).not.toContain("unsafe-eval");
  expect(policy).not.toBe(second.headers()["content-security-policy"]);
  expect(first.headers()["strict-transport-security"]).toContain(
    "max-age=31536000",
  );
  const nonce = /nonce-([^']+)/.exec(policy)?.[1];
  expect(nonce).toBeTruthy();
  expect(await first.text()).toContain(`nonce="${nonce}"`);
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /A profile/ })).toBeVisible();
  expect(errors).toEqual([]);
  const admin = await request.get("/admin/login");
  expect(admin.headers()["cache-control"]).toContain("no-store");
  expect(admin.headers()["x-robots-tag"]).toContain("noindex");
  expect((await request.get("/test-cache-reset")).status()).toBe(404);
});
