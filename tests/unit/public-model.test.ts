import assert from "node:assert/strict";
import test from "node:test";
import { publicRecords } from "../fixtures/public-records";
import {
  isPublished,
  safeLink,
  toPublicPortfolio,
} from "../../lib/content/public-model";
import { portfolioMetadata } from "../../lib/content/metadata";
import { textItems } from "../../lib/content/text-items";

test("public DTO preserves all source collections and excludes private facts and operational fields", () => {
  const records = publicRecords();
  records.settings = Object.assign({}, records.settings, {
    owner_note: "PRIVATE_NOTE",
  });
  const portfolio = toPublicPortfolio(records, null);
  assert.equal(portfolio.projects.length, 15);
  assert.equal(portfolio.certifications.length, 9);
  assert.equal(portfolio.experience.length, 4);
  assert.equal(portfolio.achievements.length, 5);
  assert.equal(portfolio.education.length, 3);
  assert.equal(
    portfolio.skillGroups.flatMap((group) => group.skills).length,
    36,
  );
  assert.equal(portfolio.interests.length, 8);
  assert.equal(portfolio.facts.length, 0);
  const text = JSON.stringify(portfolio);
  for (const privateValue of [
    "02 January 2003",
    "Naldanga",
    "1521781591",
    "PRIVATE_NOTE",
    '"published_at"',
    '"status"',
  ])
    assert.ok(!text.includes(privateValue), privateValue);
  const project = portfolio.projects.find((item) => item.slug === "gsa-sust");
  assert.ok(project);
  assert.equal(project.title, "GSA-SUST website");
  assert.equal(project.detailTitle, "Gaibandha Students Association Website");
  assert.equal(
    portfolioMetadata(portfolio, { project }).alternates?.canonical,
    "https://farzine.vercel.app/projects/gsa-sust",
  );
});

test("draft/archive/future and hidden groups/media never become public output or metadata", () => {
  const records = publicRecords();
  const [draft, archived, future] = records.projects;
  draft.status = "draft";
  archived.status = "archived";
  future.published_at = "2999-01-01T00:00:00Z";
  records.skillGroups[0].is_visible = false;
  records.media[0].is_public = false;
  records.gallery = [
    {
      id: "private-gallery",
      project_id: records.projects[3].id,
      media_id: records.media[0].id,
    },
  ];
  const portfolio = toPublicPortfolio(records, null);
  assert.equal(portfolio.projects.length, 12);
  assert.ok(
    !portfolio.projects.some((item) =>
      [draft.slug, archived.slug, future.slug].includes(item.slug),
    ),
  );
  assert.equal(portfolio.settings.portrait, null);
  assert.ok(
    !portfolio.skillGroups.some(
      (group) => group.id === records.skillGroups[0].id,
    ),
  );
  assert.equal(portfolio.projects[0].gallery.length, 0);
  assert.equal(
    isPublished({ status: "published", published_at: "invalid" }),
    false,
  );
});

test("unsafe stored links and paths produce no active action or image", () => {
  for (const url of [
    "javascript:alert(1)",
    "data:text/html,test",
    "//evil.example",
    "https://user:pass@example.com",
    "https://example.com/\n",
    "mailto:test@example.com?subject=Injected",
    "mailto:test%0D%0A@example.com",
  ])
    assert.equal(safeLink(url, true), null);
  assert.equal(
    safeLink("mailto:test@example.com", true),
    "mailto:test@example.com",
  );
  assert.equal(safeLink("mailto:test@example.com"), null);
  const records = publicRecords();
  records.projects[0].source_url = "javascript:alert(1)";
  records.media[0].legacy_path = "/assets/img/../../secret.png";
  const portfolio = toPublicPortfolio(records, null);
  assert.equal(portfolio.projects[0].sourceUrl, null);
  assert.equal(portfolio.settings.portrait, null);
});

test("repeated paragraphs/bullets get stable distinct keys without dropping source text", () => {
  assert.deepEqual(
    textItems(["Repeat", "Repeat", "Other"]).map((item) => item.key),
    ["Repeat:1", "Repeat:2", "Other:1"],
  );
});

test("pending assets and arbitrary display-label keys cannot enter public output", () => {
  const records = publicRecords();
  records.media[0].pending_delete = true;
  records.labels = [
    { key: "technology", value: "Editable technology label" },
    { key: "__proto__", value: "bad" },
    { key: "sourceLink", value: "" },
  ];
  const portfolio = toPublicPortfolio(records, null);
  assert.equal(portfolio.settings.portrait, null);
  assert.equal(portfolio.copy.technology, "Editable technology label");
  assert.equal(portfolio.copy.sourceLink, "Project Link");
  assert.equal(Object.hasOwn(portfolio.copy, "__proto__"), false);
});

test("document downloads cannot be rendered as profile, project or gallery images", () => {
  const records = publicRecords();
  const id = "00000000-0000-4000-8000-000000000007";
  records.media.push({
    id,
    label: "Local PDF",
    kind: "document",
    bucket: "portfolio-public",
    object_path: `${id}/${id}.pdf`,
    mime_type: "application/pdf",
    size_bytes: 100,
    is_public: true,
  });
  if (!records.settings) throw Error("Missing fixture settings");
  records.settings.profile_media_id = id;
  records.projects[0].cover_media_id = id;
  records.gallery.push({
    id: "document-gallery",
    project_id: records.projects[0].id,
    media_id: id,
  });
  records.documents.push({
    id: "document-link",
    title: "Local PDF",
    media_id: id,
    is_visible: true,
  });
  const value = toPublicPortfolio(records, "https://local-test.supabase.co");
  assert.equal(value.settings.portrait, null);
  assert.equal(value.projects[0].cover, null);
  assert.equal(value.projects[0].gallery.length, 0);
  assert.ok(
    value.documents
      .find((row) => row.id === "document-link")
      ?.url.endsWith(".pdf"),
  );
});
