import "server-only";
import type { PublicRecords } from "@/lib/content/public-model";
import { isDevelopmentSeedEnabled } from "@/lib/security/runtime-config";

export async function getDevelopmentRecords(): Promise<PublicRecords> {
  if (!isDevelopmentSeedEnabled())
    throw new Error("Development preview is disabled.");
  const { default: seed } = await import("../../data/legacy-seed.json");
  const records = seed.records;
  const preview = <T extends { is_visible?: boolean }>(rows: T[]) =>
    rows.map((row) => ({ ...row, is_visible: true }));
  return {
    settings: records.site_settings[0],
    sections: records.section_settings,
    projects: records.projects.map((row) => ({
      ...row,
      status: "published",
      published_at: "1970-01-01T00:00:00.000Z",
    })),
    media: records.media_assets,
    gallery: [],
    // Preview never exposes private birthday/address/phone/email facts.
    facts: records.profile_facts.filter((row) => row.is_visible),
    experience: preview(records.experiences),
    education: preview(records.education),
    certifications: preview(records.certifications),
    achievements: preview(records.achievements),
    skillGroups: preview(records.skill_groups),
    skills: preview(records.skills),
    interests: preview(records.interests),
    socials: preview(records.social_links),
    documents: preview(records.document_links),
    navigation: records.navigation_items,
  };
}
