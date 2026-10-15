import type { z } from "zod";
import type { FieldSpec } from "./editor-form";
import type {
  collectionSchemas,
  CollectionName,
} from "@/lib/validations/collections";
import { rootSections } from "@/lib/validations/collections";
export const collectionLabels = {
  public_labels: "Public interface labels",
  profile_facts: "Personal facts and contact",
  section_settings: "Sections",
  navigation_items: "Navigation",
  experiences: "Experience",
  education: "Education",
  certifications: "Certifications",
  achievements: "Achievements",
  skill_groups: "Skill groups",
  skills: "Skills",
  interests: "Interests",
  social_links: "Social links",
  document_links: "Resume and documents",
} satisfies Record<CollectionName, string>;
const select = <Name extends string>(
  name: Name,
  label: string,
  values: readonly string[],
): FieldSpec<Name> => ({
  name,
  label,
  type: "select",
  required: true,
  options: values.map((value) => ({ value, label: value })),
});
const url = <Name extends string>(
  name: Name,
  label = "URL",
): FieldSpec<Name> => ({ name, label, type: "url", maxLength: 2048 });
const date: FieldSpec<"date_label"> = {
  name: "date_label",
  label: "Date display text",
  maxLength: 200,
  hint: "Keep the source wording until reviewed. No dates are inferred.",
};
const image: FieldSpec<"media_id"> = {
  name: "media_id",
  label: "Media asset",
  type: "select",
};
const bullets: FieldSpec<"bullets"> = {
  name: "bullets",
  label: "Bullet points",
  type: "textarea",
  hint: "One per line, up to 100; plain text.",
};
const fields = {
  public_labels: [
    { name: "value", label: "Display text", required: true, maxLength: 200 },
  ],
  profile_facts: [
    { name: "label", label: "Label", required: true, maxLength: 100 },
    {
      name: "value",
      label: "Value",
      type: "textarea",
      required: true,
      maxLength: 1000,
    },
    select("placement", "Placement", ["about", "contact"]),
    select("icon", "Icon", ["info", "map", "email", "phone"]),
  ],
  section_settings: [
    { name: "title", label: "Section title", required: true, maxLength: 100 },
    {
      name: "filter_all_label",
      label: "All filter label",
      required: true,
      maxLength: 60,
    },
  ],
  navigation_items: [
    { name: "label", label: "Label", required: true, maxLength: 100 },
    select("section_key", "Section", rootSections),
  ],
  experiences: [
    {
      name: "organization",
      label: "Organization",
      required: true,
      maxLength: 200,
    },
    { name: "role", label: "Role", required: true, maxLength: 200 },
    date,
    bullets,
    url("url"),
  ],
  education: [
    { name: "institution", label: "Institution", maxLength: 200 },
    {
      name: "qualification",
      label: "Qualification",
      required: true,
      maxLength: 300,
    },
    date,
    {
      name: "description",
      label: "Description",
      type: "textarea",
      maxLength: 10000,
    },
    url("url"),
    image,
  ],
  certifications: [
    { name: "name", label: "Name", required: true, maxLength: 300 },
    { name: "issuer", label: "Issuer", maxLength: 200 },
    date,
    url("credential_url", "Credential URL"),
    image,
  ],
  achievements: [
    { name: "title", label: "Title", required: true, maxLength: 300 },
    { name: "result", label: "Result", type: "textarea", maxLength: 1000 },
    date,
    bullets,
    url("url"),
  ],
  skill_groups: [
    { name: "name", label: "Name", required: true, maxLength: 200 },
  ],
  skills: [
    { name: "name", label: "Name", required: true, maxLength: 150 },
    select("group_id", "Skill group", []),
    { name: "description", label: "Description", maxLength: 1000 },
    url("logo_url", "Logo URL"),
  ],
  interests: [
    { name: "name", label: "Name", required: true, maxLength: 150 },
    select("icon", "Icon", [
      "global",
      "code",
      "database",
      "camera",
      "language",
      "robot",
      "algorithm",
      "image",
    ]),
    {
      name: "color",
      label: "Icon color",
      required: true,
      maxLength: 7,
      hint: "Six-digit hex color, e.g. #21e5f3.",
    },
  ],
  social_links: [
    { name: "label", label: "Label", required: true, maxLength: 100 },
    {
      name: "url",
      label: "URL",
      required: true,
      maxLength: 2048,
      hint: "http, https or mailto.",
    },
    select("icon", "Icon", ["linkedin", "github", "email", "facebook"]),
    select("placement", "Placement", ["hero", "contact", "both"]),
  ],
  document_links: [
    { name: "title", label: "Title", required: true, maxLength: 200 },
    {
      name: "description",
      label: "Description",
      type: "textarea",
      maxLength: 2000,
    },
    url("url"),
    image,
  ],
} satisfies {
  [Name in CollectionName]: FieldSpec<
    Extract<
      Exclude<
        keyof z.output<(typeof collectionSchemas)[Name]>,
        "sort_order" | "is_visible"
      >,
      string
    >
  >[];
};
export function collectionFields(
  name: CollectionName,
  media: { id: string; label: string; kind: string; is_public: boolean }[],
  groups: { id: string; name: string }[],
): FieldSpec[] {
  const result: FieldSpec[] = fields[name].map((field) => ({ ...field }));
  for (const field of result) {
    if (field.name === "media_id")
      field.options = [
        { value: "", label: "No asset" },
        ...media
          .filter(
            (asset) => name === "document_links" || asset.kind === "image",
          )
          .map((asset) => ({
            value: asset.id,
            label: `${asset.label}${asset.is_public ? "" : " (private)"}`,
          })),
      ];
    if (field.name === "group_id")
      field.options = [
        { value: "", label: "Choose a group" },
        ...groups.map((group) => ({ value: group.id, label: group.name })),
      ];
  }
  if (name === "public_labels") return result;
  return [
    ...result,
    {
      name: "sort_order",
      label: "Display order",
      type: "number",
      required: true,
      hint: "Lower numbers appear first.",
    },
    {
      name: "is_visible",
      label: "Publicly visible",
      type: "checkbox",
      hint:
        name === "profile_facts"
          ? "Explicitly enable only facts you intend anyone to read, including through the public API."
          : name === "section_settings"
            ? "Section visibility controls display/navigation. Hide individual items to withdraw their public API data. Home identity remains the site shell."
            : "Visible items can be read publicly, including through the API.",
    },
  ];
}
export function formValues(row: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(row).map(([key, value]) => [
      key,
      Array.isArray(value)
        ? value.join("\n")
        : typeof value === "boolean"
          ? value
          : value == null
            ? ""
            : String(value),
    ]),
  );
}
