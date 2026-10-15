import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { chromium } from "@playwright/test";

const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH,
  headless: true,
});
const page = await browser.newPage({ javaScriptEnabled: false });
await page.route(/^https?:/, (route) => route.abort());
const textSource = await readFile("index.html", "utf8");
const idFor = (key) => {
  const h = createHash("sha256").update(`farzine-legacy:${key}`).digest("hex");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-5${h.slice(13, 16)}-a${h.slice(17, 20)}-${h.slice(20, 32)}`;
};
const records = {};
const provenance = [];
const add = (table, sourceKey, value, sourceFile = "index.html") => {
  const id = idFor(sourceKey);
  records[table] ||= [];
  records[table].push(table === "section_settings" ? value : { id, ...value });
  provenance.push({
    source_key: sourceKey,
    table_name: table,
    record_id: String(value.id ?? value.key ?? id),
    source_file: sourceFile,
  });
  return id;
};
try {
  await page.goto(`file://${path.resolve("index.html")}`);
  const source = await page.evaluate(() => {
    const clean = (element) =>
      element?.textContent.replace(/\s+/g, " ").trim() || "";
    const items = (selector) => [...document.querySelectorAll(selector)];
    const image = (element) => {
      const img = element.querySelector("img");
      return img
        ? {
            path: `/${img.getAttribute("src")}`,
            width: img.naturalWidth,
            height: img.naturalHeight,
          }
        : null;
    };
    return {
      settings: {
        display_name: clean(document.querySelector("h1")),
        full_name: document.title,
        twitter_handle:
          document.querySelector('meta[name="twitter:site"]')?.content || "",
        social_heading: clean(
          document
            .querySelector("#contacts .info-box .social-links")
            ?.closest(".info-box")
            .querySelector("h3"),
        ),
        biography: clean(document.querySelector("#about .content p")),
        updated_label: "Last Updated:",
        updated_display: clean(document.querySelector("#last-updated")),
        seo_title: document.title,
        seo_description: document.querySelector(
          'meta[property="og:description"]',
        ).content,
        canonical_url: document.querySelector('link[rel="canonical"]').href,
      },
      portrait: image(document.querySelector("#about")),
      sections: items(".section-title h2").map((h) => ({
        title: clean(h),
        section: h.closest("section").id,
      })),
      facts: items("#about .content li").map((li) => ({
        label: clean(li.querySelector("strong")).replace(/:$/, ""),
        value: clean(li).split(":").slice(1).join(":").trim(),
        placement: "about",
      })),
      contact: items("#contacts .info-box")
        .filter((el) => el.querySelector("p"))
        .map((el) => ({
          label: clean(el.querySelector("h3")),
          value: [...el.querySelectorAll("p")].map(clean).join("\n"),
          placement: "contact",
          icon: el.querySelector("i").className.includes("map")
            ? "map"
            : el.querySelector("i").className.includes("envelope")
              ? "email"
              : "phone",
        })),
      interests: items("#about .icon-box").map((el) => ({
        name: clean(el.querySelector("h3")),
        color: el
          .querySelector("i")
          .getAttribute("style")
          .match(/#[a-f0-9]+/i)[0],
      })),
      education: items("#education > .container .icon-box").map((el) => ({
        qualification: clean(el.querySelector("em")),
        date_label: clean(el.querySelector("h5")),
        url: el.querySelector("a").getAttribute("href"),
        image: image(el),
      })),
      certifications: items("#education .portfolio-item").map((el) => ({
        name: clean(el.querySelector("h4")),
        credential_url: el.querySelector("a")?.getAttribute("href") || "",
        image: image(el),
      })),
      experiences: items("#experience > .container:first-child .icon-box").map(
        (el) => ({
          organization: clean(el.querySelector("h4")),
          role: clean(el.querySelector("em")),
          date_label: clean(el.querySelector("h5")),
          bullets: [...el.querySelectorAll("li")].map(clean),
          url: el.querySelector("a")?.getAttribute("href") || "",
        }),
      ),
      achievements: items(
        "#experience > .container:nth-child(2) .icon-box",
      ).map((el) => ({
        title: clean(el.querySelector("h4")),
        result: clean(el.querySelector("em")),
        date_label: clean(el.querySelector("h5")),
        bullets: [...el.querySelectorAll("li")].map(clean),
        url: el.querySelector("a")?.getAttribute("href") || "",
      })),
      projects: items("#portfolio .portfolio-item").map((el) => ({
        title: clean(el.querySelector("h4")),
        category: el.classList.contains("filter-app") ? "Web" : "App",
        source: el.querySelector("a").getAttribute("href"),
        image: image(el),
      })),
      skillGroups: items("#skills .icon-box").map((el) => ({
        name: clean(el.querySelector("h4")),
        skills: el.querySelector("img")
          ? [...el.querySelectorAll("img")].map((img) => ({
              name: img.alt,
              logo_url: img.getAttribute("src"),
            }))
          : [...el.querySelectorAll("li")].map((li) => ({
              name: clean(li),
              logo_url: "",
            })),
      })),
      navigation: items(".nav-menu a").map((a) => ({
        label: clean(a),
        section_key: a.getAttribute("href").slice(1),
      })),
      documents: items("#links .icon-box").map((el) => ({
        title: clean(el.querySelector("h4")),
        description: clean(el.querySelector("p")),
        url: el.querySelector("a").getAttribute("href"),
      })),
      socials: items("#header .social-links a, #contacts .social-links a").map(
        (a) => ({
          url: a.getAttribute("href"),
          label: a.className,
          placement: a.closest("header") ? "hero" : "contact",
        }),
      ),
    };
  });
  const media = new Map();
  async function addMedia(image, label) {
    if (!image) return null;
    if (media.has(image.path)) return media.get(image.path);
    const id = add("media_assets", image.path, {
      label,
      alt_text: label,
      kind: "image",
      legacy_path: image.path,
      mime_type: /\.png$/.test(image.path) ? "image/png" : "image/jpeg",
      size_bytes: (await stat(image.path.slice(1))).size,
      width: image.width || null,
      height: image.height || null,
      is_public: true,
    });
    media.set(image.path, id);
    return id;
  }
  const portrait = await addMedia(
    source.portrait,
    source.settings.display_name,
  );
  add("site_settings", "settings", {
    ...source.settings,
    id: true,
    role_prefix: "I'm",
    roles: JSON.parse(textSource.match(/strings:\s*(\[[^\]]+\])/)[1]),
    profile_media_id: portrait,
  });
  const subsectionKeys = {
    Interests: "interests",
    "Online Certification": "certifications",
    "Competitions Experience": "achievements",
  };
  add("section_settings", "section:header", {
    key: "header",
    title: "Home",
    sort_order: 0,
    is_visible: true,
  });
  for (const [index, section] of source.sections.entries()) {
    const key = subsectionKeys[section.title] || section.section;
    add("section_settings", `section:${key}`, {
      key,
      title: section.title,
      parent_key: key === section.section ? null : section.section,
      sort_order: index + 1,
      is_visible: true,
    });
  }
  for (const [index, fact] of [...source.facts, ...source.contact].entries())
    add("profile_facts", `fact:${index}`, {
      ...fact,
      sort_order: index,
      is_visible: false,
    });
  const icons = [
    "global",
    "code",
    "database",
    "camera",
    "language",
    "robot",
    "algorithm",
    "image",
  ];
  source.interests.forEach((entry, index) => {
    add("interests", `interest:${index}`, {
      ...entry,
      icon: icons[index],
      sort_order: index,
    });
  });
  for (const [index, { image, ...entry }] of source.education.entries())
    add("education", `education:${index}`, {
      ...entry,
      media_id: await addMedia(image, entry.qualification),
      sort_order: index,
    });
  for (const [index, { image, ...entry }] of source.certifications.entries())
    add("certifications", `certification:${index}`, {
      ...entry,
      media_id: await addMedia(image, entry.name),
      sort_order: index,
    });
  for (const table of ["experiences", "achievements"])
    source[table].forEach((entry, index) => {
      add(table, `${table}:${index}`, { ...entry, sort_order: index });
    });
  for (const [index, entry] of source.projects.entries()) {
    await page.goto(`file://${path.resolve(entry.source)}`);
    const detail = await page.evaluate(() => {
      const el = document.querySelector(".portfolio-info");
      const clean = (element) =>
        element?.textContent.replace(/\s+/g, " ").trim() || "";
      const link = (label) =>
        [...el.querySelectorAll("li")]
          .find((li) => clean(li).startsWith(label))
          ?.querySelector("a")
          ?.getAttribute("href") || "";
      return {
        detail_title: clean(el.querySelector("h2")),
        paragraphs: [...el.querySelectorAll("p")].map(clean),
        technologies: clean(el.querySelector("li"))
          .split(":")
          .slice(1)
          .join(":")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        source_url: link("Github"),
        demo_url: link("Website"),
        download_url: link("APK"),
      };
    });
    add(
      "projects",
      `project:${entry.source}`,
      {
        title: entry.title,
        category: entry.category,
        slug: path.basename(entry.source, ".html").toLowerCase(),
        ...detail,
        summary: detail.paragraphs[0] || "",
        cover_media_id: await addMedia(entry.image, entry.title),
        status: "draft",
        sort_order: index,
      },
      entry.source,
    );
  }
  for (const [index, group] of source.skillGroups.entries()) {
    const groupId = add("skill_groups", `skill-group:${index}`, {
      name: group.name,
      sort_order: index,
    });
    group.skills.forEach((skill, order) => {
      add("skills", `skill:${index}:${order}`, {
        group_id: groupId,
        ...skill,
        sort_order: order,
      });
    });
  }
  source.documents.forEach((entry, index) => {
    add("document_links", `document:${index}`, { ...entry, sort_order: index });
  });
  source.navigation.forEach((entry, index) => {
    add("navigation_items", `navigation:${index}`, {
      ...entry,
      sort_order: index,
      is_visible: true,
    });
  });
  const socialEntries = new Map();
  for (const entry of source.socials) {
    if (socialEntries.has(entry.url))
      socialEntries.get(entry.url).placement = "both";
    else
      socialEntries.set(entry.url, {
        ...entry,
        icon: entry.label === "google" ? "email" : entry.label,
        label: {
          linkedin: "LinkedIn",
          github: "GitHub",
          google: "Email",
          facebook: "Facebook",
        }[entry.label],
      });
  }
  [...socialEntries.values()].forEach((entry, index) => {
    add("social_links", `social:${index}`, { ...entry, sort_order: index });
  });
  for (const [table, rows] of Object.entries(records)) {
    if (["site_settings", "section_settings"].includes(table)) continue;
    rows.forEach((row) => {
      if (
        row.is_visible === undefined &&
        !["media_assets", "projects"].includes(table)
      )
        row.is_visible = false;
    });
  }
  assert.equal(records.projects.length, 15);
  assert.equal(records.certifications.length, 9);
  assert.equal(records.experiences.length, 4);
  assert.equal(records.education.length, 3);
  assert.equal(records.achievements.length, 5);
  assert.equal(records.skills.length, 36);
  assert.equal(records.interests.length, 8);
  const snapshot = {
    base_commit: "6d774c7050fda2ab386fa4dfe297d4a4f4776715",
    records,
    provenance,
  };
  await writeFile(
    "data/legacy-seed.json",
    `${JSON.stringify(snapshot, null, 2)}\n`,
  );
  const quote = (value) =>
    value === null
      ? "null"
      : typeof value === "boolean"
        ? String(value)
        : typeof value === "number"
          ? String(value)
          : Array.isArray(value)
            ? `ARRAY[${value.map(quote).join(",")}]::text[]`
            : `'${value.replaceAll("'", "''")}'`;
  const statements = [
    "-- Historical imports: no updates/deletes; safe to rerun. Review and publish in admin.",
    "begin;",
  ];
  for (const [table, rows] of Object.entries(records)) {
    for (const row of rows) {
      // Section settings has a stable natural primary key, not a UUID column.
      const values =
        table === "section_settings"
          ? Object.fromEntries(
              Object.entries(row).filter(([key]) => key !== "id"),
            )
          : row;
      statements.push(
        `insert into public.${table} (${Object.keys(values).join(", ")}) values (${Object.values(values).map(quote).join(", ")}) on conflict do nothing;`,
      );
    }
  }
  for (const row of provenance)
    statements.push(
      `insert into private.import_provenance (${Object.keys(row).join(", ")}) values (${Object.values(row).map(quote).join(", ")}) on conflict do nothing;`,
    );
  statements.push("commit;", "");
  await writeFile("supabase/seed.sql", statements.join("\n"));
  console.log(
    Object.fromEntries(
      Object.entries(records).map(([table, rows]) => [table, rows.length]),
    ),
  );
} finally {
  await browser.close();
}
