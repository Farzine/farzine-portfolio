import { z } from "zod";
import { defaultPublicCopy, isPublicCopyKey } from "@/lib/content/public-copy";
export const publicCopyKeys =
  Object.keys(defaultPublicCopy).filter(isPublicCopyKey);
import { text, required, link, media, lines } from "./admin";

export const rootSections = [
  "header",
  "about",
  "education",
  "experience",
  "portfolio",
  "skills",
  "links",
  "contacts",
] as const;
export const sectionKeys = [
  ...rootSections,
  "interests",
  "certifications",
  "achievements",
] as const;
const display = {
  sort_order: z
    .string()
    .regex(/^\d{1,7}$/, "Use a whole number from 0 to 9999999.")
    .transform(Number),
  is_visible: z.enum(["on", ""]).transform((value) => value === "on"),
};
export const collectionSchemas = {
  public_labels: z.object({ value: required(200) }),
  profile_facts: z.object({
    label: required(100),
    value: required(1000),
    placement: z.enum(["about", "contact"]),
    icon: z.enum(["info", "map", "email", "phone"]),
    ...display,
  }),
  section_settings: z.object({
    title: required(100),
    filter_all_label: required(60),
    ...display,
  }),
  navigation_items: z.object({
    label: required(100),
    section_key: z.enum(rootSections),
    ...display,
  }),
  experiences: z.object({
    organization: required(200),
    role: required(200),
    date_label: text(200),
    bullets: lines(100, 3000),
    url: link(),
    ...display,
  }),
  education: z.object({
    institution: text(200),
    qualification: required(300),
    date_label: text(200),
    description: text(10000),
    url: link(),
    media_id: media,
    ...display,
  }),
  certifications: z.object({
    name: required(300),
    issuer: text(200),
    date_label: text(200),
    credential_url: link(),
    media_id: media,
    ...display,
  }),
  achievements: z.object({
    title: required(300),
    result: text(1000),
    date_label: text(200),
    bullets: lines(100, 3000),
    url: link(),
    ...display,
  }),
  skill_groups: z.object({ name: required(200), ...display }),
  skills: z.object({
    group_id: z.uuid(),
    name: required(150),
    description: text(1000),
    logo_url: link(),
    ...display,
  }),
  interests: z.object({
    name: required(150),
    icon: z.enum([
      "global",
      "code",
      "database",
      "camera",
      "language",
      "robot",
      "algorithm",
      "image",
    ]),
    color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Use a six-digit hex color."),
    ...display,
  }),
  social_links: z.object({
    label: required(100),
    url: link(true).pipe(z.string().min(1, "Enter a URL.")),
    icon: z.enum(["linkedin", "github", "email", "facebook"]),
    placement: z.enum(["hero", "contact", "both"]),
    ...display,
  }),
  document_links: z
    .object({
      title: required(200),
      description: text(2000),
      url: link(),
      media_id: media,
      ...display,
    })
    .refine((value) => !!value.url !== !!value.media_id, {
      path: ["url"],
      message: "Provide a document or a URL; clear the other field.",
    }),
};
export type CollectionName = keyof typeof collectionSchemas;
export const collectionNameSchema = z.enum([
  "public_labels",
  "profile_facts",
  "section_settings",
  "navigation_items",
  "experiences",
  "education",
  "certifications",
  "achievements",
  "skill_groups",
  "skills",
  "interests",
  "social_links",
  "document_links",
]);
export const collectionId = (name: CollectionName) =>
  name === "public_labels"
    ? z.enum(publicCopyKeys)
    : name === "section_settings"
      ? z.enum(sectionKeys)
      : z.uuid();
