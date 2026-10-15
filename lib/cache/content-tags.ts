export const publicContentTables = [
  "site_settings",
  "section_settings",
  "projects",
  "experiences",
  "education",
  "certifications",
  "achievements",
  "skill_groups",
  "skills",
  "interests",
  "social_links",
  "navigation_items",
  "profile_facts",
  "media_assets",
  "project_media",
  "project_slug_aliases",
] as const;
export type PublicContentTable = (typeof publicContentTables)[number];
export function contentTag(table: PublicContentTable) {
  return `portfolio:${table}`;
}
export function publicReadTags(
  input: string,
  origin: string,
  method = "GET",
): string[] {
  if (method !== "GET") return [];
  const url = new URL(input);
  if (url.origin !== origin) return [];
  const table = publicContentTables.find(
    (table) => url.pathname === `/rest/v1/${table}`,
  );
  if (!table) return [];
  const tags = [contentTag(table)];
  if (table === "skills") tags.push(contentTag("skill_groups"));
  if (table === "project_slug_aliases") tags.push(contentTag("projects"));
  if (table === "project_media")
    tags.push(contentTag("projects"), contentTag("media_assets"));
  return tags;
}
