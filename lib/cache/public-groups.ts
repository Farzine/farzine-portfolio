export const publicGroups = [
  "labels",
  "settings",
  "sections",
  "projects",
  "media",
  "gallery",
  "facts",
  "experience",
  "education",
  "certifications",
  "achievements",
  "skillGroups",
  "skills",
  "interests",
  "socials",
  "documents",
  "navigation",
] as const;
export type PublicGroup = (typeof publicGroups)[number];
export const publicTag = (group: PublicGroup) => `portfolio:${group}`;

// Include RLS-dependent queries whose membership can change with the edited row.
export const collectionGroups = {
  public_labels: ["labels"],
  profile_facts: ["facts"],
  section_settings: ["sections"],
  navigation_items: ["navigation"],
  experiences: ["experience"],
  education: ["education"],
  certifications: ["certifications"],
  achievements: ["achievements"],
  skill_groups: ["skillGroups", "skills"],
  skills: ["skills"],
  interests: ["interests"],
  social_links: ["socials"],
  document_links: ["documents"],
} as const satisfies Record<string, readonly PublicGroup[]>;
