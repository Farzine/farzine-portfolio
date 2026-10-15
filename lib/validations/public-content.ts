import { z } from "zod";
const text = (max: number) => z.string().max(max);
export const webUrl = z
  .string()
  .max(2048)
  .refine((value) => {
    if (!value) return true;
    try {
      const url = new URL(value);
      return (
        ["https:", "http:"].includes(url.protocol) &&
        !url.username &&
        !url.password &&
        !/\s/.test(value)
      );
    } catch {
      return false;
    }
  }, "Use an http or https URL without credentials.");
export const navigationUrl = z
  .string()
  .max(2048)
  .refine((value) => {
    return (
      [
        "/",
        "/projects",
        "/#about",
        "/#experience",
        "/#skills",
        "/#education",
        "/#certifications",
        "/#achievements",
        "/#interests",
        "/#contact",
        "/#links",
      ].includes(value) ||
      (value !== "" && webUrl.safeParse(value).success)
    );
  }, "Choose a portfolio route or valid web URL.");
export function safeImageSource(
  value: string,
  supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL,
): string {
  if (
    value.startsWith("/assets/img/") &&
    !value.split("/").includes("..") &&
    /^\/assets\/img\/[a-zA-Z0-9 /_.-]+\.(png|jpe?g|webp|avif)$/.test(value)
  )
    return value;
  try {
    if (!supabaseUrl) return "";
    const url = new URL(value);
    const allowed = new URL(supabaseUrl);
    if (
      url.origin === allowed.origin &&
      !url.username &&
      !url.password &&
      !url.search &&
      /^\/storage\/v1\/object\/public\/portfolio-public\/[a-f0-9-]{36}\/[a-f0-9-]{36}\.(png|jpg|webp|avif)$/.test(
        url.pathname,
      )
    )
      return value;
  } catch {
    return "";
  }
  return "";
}
const image = z.string().transform((value) => safeImageSource(value));
const published = z.literal("published");
const publication = { status: published };
const publicProjectRowSchema = z.object({
  ...publication,
  title: text(180),
  slug: z
    .string()
    .max(180)
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/),
  summary: text(1200),
  details: text(30000),
  category: text(80),
  technologies: z.array(text(120)).max(40),
  cover_image: image,
  cover_alt: text(400).default(""),
  repository_url: webUrl.default(""),
  demo_url: webUrl.default(""),
  download_url: webUrl.default(""),
  featured: z.boolean().default(false),
  seo_title: text(160).default(""),
  seo_description: text(320).default(""),
});
export const publicProjectSchema = publicProjectRowSchema.transform(
  ({ status: _status, ...content }) => content,
);
export const publicProjectCardSchema = publicProjectRowSchema
  .pick({
    status: true,
    title: true,
    slug: true,
    summary: true,
    category: true,
    technologies: true,
    cover_image: true,
    cover_alt: true,
    featured: true,
  })
  .transform(({ status: _status, ...content }) => content);

export const publicProfileSchema = z
  .object({
    ...publication,
    name: text(120),
    headline: text(200).default(""),
    summary: text(600).default(""),
    biography: text(10000).default(""),
    profile_image: image.default(""),
    favicon_image: image.default(""),
    social_preview_image: image.default(""),
    hero_visual_caption: text(240).default(""),
    last_updated_label: text(120).default(""),
    show_last_updated: z.boolean().default(false),
    primary_cta_label: text(80).default("Explore projects"),
    primary_cta_href: z
      .enum(["/projects", "/#about", "/#contact"])
      .default("/projects"),
    secondary_cta_label: text(80).default("Contact"),
    secondary_cta_href: z.enum(["/#contact", "/#links"]).default("/#contact"),
    footer_text: text(400).default(""),
    seo_title: text(160).default(""),
    seo_description: text(320).default(""),
    contact_form_enabled: z.boolean().default(false),
    orbit_enabled: z.boolean().default(true),
  })
  .transform(({ status: _status, ...content }) => content);
export const publicSectionSchema = z
  .object({
    ...publication,
    key: z.enum([
      "about",
      "projects",
      "experience",
      "skills",
      "education",
      "certifications",
      "achievements",
      "interests",
      "contact",
      "links",
    ]),
    title: text(160),
    subtitle: text(500).default(""),
    visible: z.literal(true),
    sort_order: z.number().int().min(0).max(10000),
  })
  .transform(({ status: _status, visible: _visible, ...content }) => content);
export const publicExperienceSchema = z
  .object({
    ...publication,
    organization: text(200),
    role: text(200),
    date_label: text(200),
    location: text(200).default(""),
    bullets: z.array(text(2000)).max(30),
    url: webUrl,
  })
  .transform(({ status: _status, ...content }) => content);
export const publicEducationSchema = z
  .object({
    ...publication,
    institution: text(240),
    qualification: text(240),
    date_label: text(200),
    description: text(10000).default(""),
    image,
    url: webUrl,
  })
  .transform(({ status: _status, ...content }) => content);
export const publicCertificationSchema = z
  .object({
    ...publication,
    name: text(240),
    issuer: text(240).default(""),
    date_label: text(200).default(""),
    image,
    credential_url: webUrl,
  })
  .transform(({ status: _status, ...content }) => content);
export const publicAchievementSchema = z
  .object({
    ...publication,
    name: text(240),
    context: text(400),
    result: text(1000),
    description: text(10000),
    url: webUrl,
  })
  .transform(({ status: _status, ...content }) => content);
export const publicSocialSchema = z
  .object({
    ...publication,
    label: text(80),
    icon: z.enum(["github", "linkedin", "facebook", "link"]),
    url: webUrl,
  })
  .transform(({ status: _status, ...content }) => content);
export const publicNavigationSchema = z
  .object({
    ...publication,
    label: text(80),
    url: navigationUrl,
    kind: z.enum(["navigation", "resume", "document"]),
  })
  .transform(({ status: _status, ...content }) => content);
export const publicInterestSchema = z
  .object({ ...publication, name: text(120) })
  .transform(({ status: _status, ...content }) => content);
export const publicFactSchema = z
  .object({
    is_public: z.literal(true),
    label: text(80),
    value: text(500),
    kind: z.enum(["text", "email", "phone"]),
  })
  .transform(({ is_public: _public, ...content }) => content);
export type PublicProjectCard = z.output<typeof publicProjectCardSchema>;
export type PublicProject = z.output<typeof publicProjectSchema>;
export type PublicProfile = z.output<typeof publicProfileSchema>;
export type PublicSection = z.output<typeof publicSectionSchema>;
export const publicSkillSchema = z.object({
  name: z.string().min(1).max(120),
  description: z.string().max(1000).default(""),
});
export type PublicPortfolio = {
  profile: PublicProfile | null;
  sections: PublicSection[];
  projects: PublicProjectCard[];
  experiences: z.output<typeof publicExperienceSchema>[];
  education: z.output<typeof publicEducationSchema>[];
  certifications: z.output<typeof publicCertificationSchema>[];
  achievements: z.output<typeof publicAchievementSchema>[];
  skillGroups: { name: string; skills: z.output<typeof publicSkillSchema>[] }[];
  interests: z.output<typeof publicInterestSchema>[];
  socialLinks: z.output<typeof publicSocialSchema>[];
  navigation: z.output<typeof publicNavigationSchema>[];
  facts: z.output<typeof publicFactSchema>[];
  demo: boolean;
};

export const publicGalleryImageSchema = z.object({
  src: z.string().refine((value) => Boolean(safeImageSource(value))),
  alt: z.string().min(1).max(400),
  caption: z.string().max(400),
  width: z.number().int().positive().max(6000),
  height: z.number().int().positive().max(6000),
});
export type PublicGalleryImage = z.output<typeof publicGalleryImageSchema>;
