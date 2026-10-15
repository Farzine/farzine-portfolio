import type { PublicRecords } from "../../lib/content/public-model";
import seed from "../../data/legacy-seed.json";

export function publicRecords(): PublicRecords {
  const visible = <T>(items: T[]) =>
    items.map((item) => ({ ...item, is_visible: true }));
  return {
    settings: seed.records.site_settings[0],
    sections: seed.records.section_settings,
    projects: seed.records.projects.map((project) => ({
      ...project,
      status: "published",
      published_at: "1970-01-01T00:00:00Z",
    })),
    media: seed.records.media_assets,
    gallery: [],
    facts: seed.records.profile_facts,
    experience: visible(seed.records.experiences),
    education: visible(seed.records.education),
    certifications: visible(seed.records.certifications),
    achievements: visible(seed.records.achievements),
    skillGroups: visible(seed.records.skill_groups),
    skills: visible(seed.records.skills),
    interests: visible(seed.records.interests),
    socials: visible(seed.records.social_links),
    documents: visible(seed.records.document_links),
    navigation: seed.records.navigation_items,
  };
}
