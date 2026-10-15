const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE || "@playwright/test"
);
import { writeFile } from "node:fs/promises";
const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH || "/usr/bin/google-chrome",
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});
const report = {
  date: new Date().toISOString(),
  browser: browser.version(),
  pages: [],
};
for (const [name, url] of [
  ["local", "http://127.0.0.1:4173/"],
  ["live", "https://farzine.vercel.app/"],
]) {
  for (const [size, viewport] of [
    ["desktop", { width: 1440, height: 900 }],
    ["mobile", { width: 390, height: 844 }],
  ]) {
    const page = await browser.newPage({ viewport, ignoreHTTPSErrors: true });
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    try {
      await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
      await page.waitForTimeout(2500);
      await page.screenshot({
        path: `docs/reference/${name}-${size}-home.png`,
        fullPage: true,
      });
      const data = await page.evaluate(() => ({
        title: document.title,
        html: document.documentElement.outerHTML,
        fonts: document.fonts.status,
        sections: [...document.querySelectorAll("section")].map((s) => ({
          id: s.id,
          text: s.innerText,
          html: s.innerHTML,
        })),
        links: [...document.querySelectorAll("a")].map((a) => ({
          text: a.textContent.trim(),
          url: a.getAttribute("href"),
        })),
        images: [...document.images].map((i) => ({
          src: i.getAttribute("src"),
          alt: i.alt,
          loaded: i.complete && i.naturalWidth > 0,
          width: i.naturalWidth,
          height: i.naturalHeight,
        })),
      }));
      if (size === "desktop")
        await writeFile(
          `docs/reference/${name}-content.json`,
          `${JSON.stringify(data, null, 2)}\n`,
        );
      const shots = [];
      for (const section of [
        "about",
        "education",
        "experience",
        "portfolio",
        "skills",
        "links",
        "contacts",
      ]) {
        await page.evaluate((id) => {
          document.querySelector("#header").classList.add("header-top");
          document.querySelectorAll(".nav-menu li").forEach((li) => {
            li.classList.toggle(
              "active",
              li.querySelector("a")?.getAttribute("href") === `#${id}`,
            );
          });
          document.querySelectorAll("section").forEach((s) => {
            s.classList.toggle("section-show", s.id === id);
          });
          document.querySelector("#site-stats").style.display = "none";
          window.scrollTo(0, 0);
        }, section);
        await page.waitForTimeout(500);
        await page.screenshot({
          path: `docs/reference/${name}-${size}-${section}.png`,
          fullPage: true,
        });
        shots.push(section);
      }
      report.pages.push({
        name,
        size,
        url,
        errors,
        shots,
        brokenImages: data.images.filter((i) => !i.loaded),
        overflow: await page.evaluate(
          () => document.documentElement.scrollWidth > innerWidth,
        ),
      });
    } catch (e) {
      report.pages.push({ name, size, error: e.message, errors });
    }
    await page.close();
  }
}
await writeFile(
  "docs/reference/capture-report.json",
  `${JSON.stringify(report, null, 2)}\n`,
);
await browser.close();
console.log(JSON.stringify(report, null, 2));
