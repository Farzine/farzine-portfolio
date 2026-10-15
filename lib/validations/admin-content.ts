import { z } from "zod";
import { webUrl, safeImageSource } from "./public-content";
export const contentStatus = z.enum(["draft", "published", "archived"]);
const text = (max: number) => z.string().trim().max(max);
const image = text(2048).refine(
  (value) => value === "" || safeImageSource(value) === value,
  "Choose a supported portfolio image.",
);
export const recordId = z.uuid();
export const recordVersion = z.iso.datetime({ offset: true });
export const loginSchema = z
  .object({
    email: z.email().max(254),
    password: z.string().min(1, "Enter your password.").max(256),
  })
  .strict();
export const projectInputSchema = z
  .object({
    title: text(180).min(1, "Enter a title."),
    slug: text(180).regex(
      /^[a-z0-9]+(-[a-z0-9]+)*$/,
      "Use lowercase letters, numbers and single hyphens.",
    ),
    summary: text(1200),
    details: text(30000),
    category: text(80),
    technologies: z
      .array(text(120).min(1))
      .max(40)
      .transform((items) => [...new Set(items)]),
    cover_image: image,
    cover_alt: text(400),
    repository_url: webUrl,
    demo_url: webUrl,
    download_url: webUrl,
    featured: z.boolean(),
    sort_order: z.number().int().min(0).max(10000),
    status: contentStatus,
    seo_title: text(160),
    seo_description: text(320),
  })
  .strict()
  .superRefine((item, ctx) => {
    if (item.cover_image && !item.cover_alt)
      ctx.addIssue({
        code: "custom",
        path: ["cover_alt"],
        message: "Describe the cover image.",
      });
    if (item.status === "published" && !item.summary)
      ctx.addIssue({
        code: "custom",
        path: ["summary"],
        message: "Add a summary before publishing.",
      });
  });
export const settingsInputSchema = z
  .object({
    name: text(120).min(1, "Enter a name."),
    contact_form_enabled: z.boolean(),
    orbit_enabled: z.boolean(),
    headline: text(200),
    summary: text(600),
    biography: text(10000),
    profile_image: image,
    favicon_image: image,
    social_preview_image: image,
    hero_visual_caption: text(240),
    last_updated_label: text(120),
    show_last_updated: z.boolean(),
    primary_cta_label: text(80),
    primary_cta_href: z.enum(["/projects", "/#about", "/#contact"]),
    secondary_cta_label: text(80),
    secondary_cta_href: z.enum(["/#contact", "/#links"]),
    footer_text: text(400),
    seo_title: text(160),
    seo_description: text(320),
    status: contentStatus,
  })
  .strict();
export type ProjectInput = z.output<typeof projectInputSchema>;
export type SettingsInput = z.output<typeof settingsInputSchema>;
