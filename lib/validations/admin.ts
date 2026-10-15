import { z } from "zod";
import { safeLink } from "@/lib/content/public-model";

export const text = (max: number) => z.string().trim().max(max);
export const required = (max: number) =>
  text(max).min(1, "This field is required.");
export const link = (mailto = false) =>
  text(2048).refine((value) => !value || !!safeLink(value, mailto), {
    message: mailto
      ? "Use an http, https or mailto URL."
      : "Use an http or https URL.",
  });
export const media = z
  .union([z.uuid(), z.literal("")])
  .transform((value) => value || null);
export const lines = (count: number, length: number) =>
  text(count * (length + 1))
    .transform((value) =>
      value
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean),
    )
    .pipe(z.array(required(length)).max(count));
export const revisionSchema = z.iso.datetime({ offset: true });
export const idSchema = z.uuid();
export const loginSchema = z.object({
  email: z.email().max(254),
  password: z.string().min(1, "Enter your password.").max(256),
});

export const settingsSchema = z
  .object({
    display_name: required(100),
    full_name: required(150),
    role_prefix: text(40),
    roles: lines(10, 200),
    biography: text(10000),
    profile_media_id: media,
    seo_image_media_id: media,
    icon_media_id: media,
    twitter_handle: text(16).refine(
      (value) => !value || /^@[A-Za-z0-9_]{1,15}$/.test(value),
      "Use @ followed by up to 15 letters, numbers or underscores.",
    ),
    social_heading: text(100),
    updated_label: text(100),
    updated_display: text(100),
    footer_text: text(2000),
    seo_title: text(160),
    seo_description: text(500),
    canonical_url: link(),
    primary_cta_label: text(100),
    primary_cta_url: link(true),
    secondary_cta_label: text(100),
    secondary_cta_url: link(true),
  })
  .superRefine((value, context) => {
    for (const prefix of ["primary", "secondary"] as const) {
      if (!!value[`${prefix}_cta_label`] !== !!value[`${prefix}_cta_url`])
        context.addIssue({
          code: "custom",
          path: [`${prefix}_cta_url`],
          message: "Provide both a label and a URL, or leave both empty.",
        });
    }
  });

export const projectSchema = z
  .object({
    title: required(200),
    detail_title: text(200),
    slug: required(100).regex(
      /^[a-z0-9]+(-[a-z0-9]+)*$/,
      "Use lowercase letters, numbers and single hyphens.",
    ),
    summary: text(3000),
    paragraphs: lines(100, 3000),
    technologies: lines(100, 100),
    category: required(60),
    cover_media_id: media,
    source_url: link(),
    demo_url: link(),
    download_url: link(),
    status: z.enum(["draft", "published", "archived"]),
    published_at: z
      .union([revisionSchema, z.literal("")])
      .transform((value) => value || null),
    featured: z.enum(["on", ""]).transform((value) => value === "on"),
    sort_order: z
      .string()
      .regex(/^\d{1,7}$/, "Use a whole number between 0 and 9999999.")
      .transform(Number),
    seo_title: text(160),
    seo_description: text(500),
  })
  .superRefine((value, context) => {
    if (value.status === "published" && !value.published_at)
      context.addIssue({
        code: "custom",
        path: ["published_at"],
        message: "Set a publication time before publishing.",
      });
  });
export const gallerySchema = z.object({
  project_id: idSchema,
  media_id: idSchema,
  caption: text(500),
  sort_order: z
    .string()
    .regex(/^\d{1,7}$/)
    .transform(Number),
});

// Only declared keys are read. Form action metadata and privileged extra fields are ignored.
export function readFields<T extends z.ZodObject>(schema: T, form: FormData) {
  return Object.fromEntries(
    Object.keys(schema.shape).map((key) => [key, form.get(key) ?? ""]),
  );
}
export type ActionState = {
  ok?: boolean;
  message?: string;
  errors?: Record<string, string[]>;
  revision?: string;
};
export type EditorAction = (
  previous: ActionState,
  data: FormData,
) => Promise<ActionState>;
export type ProjectInput = z.output<typeof projectSchema>;
export type SettingsInput = z.output<typeof settingsSchema>;
