import { expect, test } from "@playwright/test";

test("fresh CSP nonces protect public, recovery and login pages without breaking hydration", async ({
  page,
  request,
}) => {
  await page.addInitScript(() => {
    const violations: string[] = [];
    Reflect.set(window, "__cspViolations", violations);
    document.addEventListener("securitypolicyviolation", (event) =>
      violations.push(`${event.effectiveDirective}:${event.blockedURI}`),
    );
  });
  const nonces = new Set<string>();
  for (const path of [
    "/",
    "/projects/gsa-sust",
    "/does-not-exist",
    "/admin/login",
  ]) {
    const response = await page.goto(path);
    const headers = response?.headers() || {};
    const nonce =
      headers["content-security-policy"]?.match(/'nonce-([^']+)'/)?.[1];
    expect(nonce).toMatch(/^[A-Za-z0-9+/]{24}$/);
    expect(nonces.has(nonce || "")).toBe(false);
    nonces.add(nonce || "");
    expect(headers["cache-control"]).toContain("no-store");
    expect(headers["x-frame-options"]).toBe("DENY");
    expect(headers["x-content-type-options"]).toBe("nosniff");
    if (path === "/does-not-exist") {
      await expect(
        page.getByRole("link", { name: "Return home" }),
      ).toBeVisible();
    } else {
      await expect(
        page.getByRole("button", { name: "Light theme", exact: true }),
      ).toBeVisible();
    }
    expect(
      await page
        .locator("#theme-init")
        .evaluate((element) =>
          element instanceof HTMLScriptElement ? element.nonce : "",
        ),
    ).toBe(nonce);
    expect(
      await page.evaluate(() => Reflect.get(window, "__cspViolations")),
    ).toEqual([]);
    if (path === "/admin/login")
      expect(headers["x-robots-tag"]).toContain("noindex");
  }
  const forged = await request.get("/", {
    headers: {
      "x-nonce": "attacker-controlled",
      "content-security-policy": "script-src *",
    },
  });
  expect(forged.headers()["content-security-policy"]).not.toContain(
    "attacker-controlled",
  );
  await page.route(
    (url) => url.pathname === "/",
    async (route) => {
      const response = await route.fetch();
      const html = await response.text();
      await route.fulfill({
        response,
        body: html.replace(
          "</head>",
          "<script>globalThis.unauthorizedInlineScript=true</script></head>",
        ),
      });
    },
  );
  await page.goto("/");
  await expect
    .poll(() =>
      page.evaluate(() => Reflect.get(window, "__cspViolations").length),
    )
    .toBeGreaterThan(0);
  expect(
    await page.evaluate(() => Reflect.get(window, "unauthorizedInlineScript")),
  ).toBeUndefined();
});

test("SEO uses published canonical URLs, real JSON-LD and excludes private routes", async ({
  page,
  request,
}) => {
  const map = await request.get("/sitemap.xml");
  expect(map.status()).toBe(200);
  const xml = await map.text();
  expect(xml.match(/<loc>/g) || []).toHaveLength(17);
  expect(xml).toContain("https://farzine.vercel.app/projects/gsa-sust");
  for (const value of [
    "/admin",
    "private-regression-fixture",
    "PRIVATE_TEST_CANARY",
    "/legacy/",
  ])
    expect(xml).not.toContain(value);
  const robots = await (await request.get("/robots.txt")).text();
  expect(robots).toContain("Disallow: /admin");
  expect(robots).toContain("Disallow: /auth");
  expect(robots).toContain("Sitemap: https://farzine.vercel.app/sitemap.xml");
  await page.goto("/");
  const graph = JSON.parse(
    (await page.locator('script[type="application/ld+json"]').textContent()) ||
      "null",
  );
  expect(
    graph["@graph"].map((item: { "@type": string }) => item["@type"]),
  ).toEqual(["Person", "WebSite"]);
  expect(graph["@graph"][0].name).toBe("MD. Farzine Hossen");
  expect(JSON.stringify(graph)).not.toContain("02 January 2003");
  await page.goto("/projects/gsa-sust");
  const project = JSON.parse(
    (await page.locator('script[type="application/ld+json"]').textContent()) ||
      "null",
  );
  expect(project["@graph"][1]["@type"]).toBe("CreativeWork");
  expect(project["@graph"][1].name).toBe(
    "Gaibandha Students Association Website",
  );
  await expect(page.locator('meta[property="og:url"]')).toHaveAttribute(
    "content",
    "https://farzine.vercel.app/projects/gsa-sust",
  );
  const denied = await request.get("/admin");
  expect(denied.headers()["x-robots-tag"]).toContain("noindex");
  expect(await denied.text()).not.toContain("PRIVATE_TEST_CANARY");
});
