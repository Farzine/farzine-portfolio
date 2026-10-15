import { z } from "zod";
import { contentStatus, recordId } from "./admin-content";
import { webUrl, navigationUrl, safeImageSource } from "./public-content";
const text = (max: number) => z.string().trim().max(max);
const requiredText = (max: number) => text(max).min(1, "Enter a value.");
const image = text(2048).refine(
  (value) => !value || safeImageSource(value) === value,
  "Choose a supported portfolio image.",
);
const order = z.number().int().min(0).max(10000);
const publication = { status: contentStatus, sort_order: order };
export const experiencesSchema = z
  .object({
    ...publication,
    organization: requiredText(200),
    role: requiredText(200),
    date_label: text(200),
    location: text(200),
    bullets: z.array(requiredText(2000)).max(30),
    url: webUrl,
  })
  .strict();
export const educationSchema = z
  .object({
    ...publication,
    institution: requiredText(240),
    qualification: requiredText(240),
    date_label: text(200),
    description: text(10000),
    image,
    url: webUrl,
  })
  .strict();
export const certificationsSchema = z
  .object({
    ...publication,
    name: requiredText(240),
    issuer: text(240),
    date_label: text(200),
    image,
    credential_url: webUrl,
  })
  .strict();
export const achievementsSchema = z
  .object({
    ...publication,
    name: requiredText(240),
    context: text(400),
    result: text(1000),
    description: text(10000),
    url: webUrl,
  })
  .strict();
export const skill_groupsSchema = z
  .object({ ...publication, name: requiredText(120) })
  .strict();
export const skillsSchema = z
  .object({
    ...publication,
    group_id: recordId,
    name: requiredText(120),
    description: text(1000),
  })
  .strict();
export const interestsSchema = z
  .object({ ...publication, name: requiredText(120) })
  .strict();
export const social_linksSchema = z
  .object({
    ...publication,
    label: requiredText(80),
    icon: z.enum(["github", "linkedin", "facebook", "link"]),
    url: webUrl.refine((value) => value !== "", "Enter a URL."),
  })
  .strict();
export const navigation_itemsSchema = z
  .object({
    ...publication,
    label: requiredText(80),
    url: navigationUrl,
    kind: z.enum(["navigation", "resume", "document"]),
  })
  .strict();
export const section_settingsSchema = z
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
    title: requiredText(160),
    subtitle: text(500),
    visible: z.boolean(),
  })
  .strict();
export const profile_factsSchema = z
  .object({
    sort_order: order,
    label: requiredText(80),
    value: requiredText(500),
    kind: z.enum(["text", "email", "phone"]),
    is_public: z.boolean(),
  })
  .strict()
  .superRefine((value, ctx) => {
    if (value.kind === "email" && !z.email().safeParse(value.value).success)
      ctx.addIssue({
        code: "custom",
        path: ["value"],
        message: "Enter a valid email address.",
      });
    if (value.kind === "phone" && !/^\+?[0-9 ()-]{5,40}$/.test(value.value))
      ctx.addIssue({
        code: "custom",
        path: ["value"],
        message: "Enter a valid telephone number.",
      });
  });
export const project_mediaSchema = z
  .object({
    project_id: recordId,
    media_id: recordId,
    caption: requiredText(400),
    sort_order: order,
  })
  .strict();
export const collectionInputSchema = z.discriminatedUnion("kind", [
  z
    .object({ kind: z.literal("project_media"), value: project_mediaSchema })
    .strict(),
  z
    .object({ kind: z.literal("experiences"), value: experiencesSchema })
    .strict(),
  z.object({ kind: z.literal("education"), value: educationSchema }).strict(),
  z
    .object({ kind: z.literal("certifications"), value: certificationsSchema })
    .strict(),
  z
    .object({ kind: z.literal("achievements"), value: achievementsSchema })
    .strict(),
  z
    .object({ kind: z.literal("skill_groups"), value: skill_groupsSchema })
    .strict(),
  z.object({ kind: z.literal("skills"), value: skillsSchema }).strict(),
  z.object({ kind: z.literal("interests"), value: interestsSchema }).strict(),
  z
    .object({ kind: z.literal("social_links"), value: social_linksSchema })
    .strict(),
  z
    .object({
      kind: z.literal("navigation_items"),
      value: navigation_itemsSchema,
    })
    .strict(),
  z
    .object({
      kind: z.literal("section_settings"),
      value: section_settingsSchema,
    })
    .strict(),
  z
    .object({ kind: z.literal("profile_facts"), value: profile_factsSchema })
    .strict(),
]);
export const collectionKind = z.enum([
  "project_media",
  "experiences",
  "education",
  "certifications",
  "achievements",
  "skill_groups",
  "skills",
  "interests",
  "social_links",
  "navigation_items",
  "section_settings",
  "profile_facts",
]);
export type CollectionKind = z.output<typeof collectionKind>;
