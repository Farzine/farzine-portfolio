import "server-only";
import seed from "@/data/portfolio-seed.json";
import { isDevelopmentDemo } from "@/lib/supabase/config";
import {
  publicSkillSchema,
  publicProfileSchema,
  publicSectionSchema,
  publicProjectSchema,
  publicProjectCardSchema,
  publicExperienceSchema,
  publicEducationSchema,
  publicCertificationSchema,
  publicAchievementSchema,
  publicSocialSchema,
  publicNavigationSchema,
  publicInterestSchema,
  type PublicPortfolio,
} from "@/lib/validations/public-content";
export function getDevelopmentPreview(): PublicPortfolio {
  if (!isDevelopmentDemo()) throw new Error("Development preview is disabled.");
  // Preview-only approval never changes the seed or writes to Supabase.
  const preview = <T extends object>(records: T[]) =>
    records.map((row) => ({ ...row, status: "published" as const }));
  return {
    profile: publicProfileSchema.parse(preview(seed.site_settings)[0]),
    sections: preview(seed.section_settings).map((row) =>
      publicSectionSchema.parse(row),
    ),
    projects: preview(seed.projects).map((row) =>
      publicProjectCardSchema.parse(row),
    ),
    experiences: preview(seed.experiences).map((row) =>
      publicExperienceSchema.parse(row),
    ),
    education: preview(seed.education).map((row) =>
      publicEducationSchema.parse(row),
    ),
    certifications: preview(seed.certifications).map((row) =>
      publicCertificationSchema.parse(row),
    ),
    achievements: preview(seed.achievements).map((row) =>
      publicAchievementSchema.parse(row),
    ),
    skillGroups: seed.skill_groups.map((group) => ({
      name: group.name,
      skills: seed.skills
        .filter((skill) => skill.group_id === group.id)
        .map((skill) => publicSkillSchema.parse(skill)),
    })),
    interests: preview(seed.interests).map((row) =>
      publicInterestSchema.parse(row),
    ),
    socialLinks: preview(seed.social_links).map((row) =>
      publicSocialSchema.parse(row),
    ),
    navigation: preview(seed.navigation_items).map((row) =>
      publicNavigationSchema.parse(row),
    ),
    facts: [],
    demo: true,
  };
}

export function getDevelopmentProject(slug: string) {
  if (!isDevelopmentDemo()) throw new Error("Development preview is disabled.");
  const row = seed.projects.find((project) => project.slug === slug);
  return row
    ? publicProjectSchema.parse({ ...row, status: "published" })
    : null;
}
