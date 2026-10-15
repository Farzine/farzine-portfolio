import type { z } from "zod";
import type { EditorField } from "./fields";
import type * as schemas from "../validations/admin-collections";
const publication: EditorField[] = [
  {
    name: "status",
    label: "Publication status",
    kind: "select",
    options: ["draft", "published", "archived"],
  },
  { name: "sort_order", label: "Display order", kind: "number" },
];
const experiencesFields = [
  { name: "organization", label: "Organization", kind: "text" },
  { name: "role", label: "Role", kind: "text" },
  {
    name: "date_label",
    label: "Dates",
    kind: "text",
    help: "Use the factual date label from your source. No dates are inferred.",
  },
  { name: "location", label: "Location", kind: "text" },
  {
    name: "bullets",
    label: "Responsibilities",
    kind: "lines",
    help: "One plain-text bullet per line. Up to 30.",
  },
  { name: "url", label: "Organization URL", kind: "url" },
] satisfies (EditorField & {
  name: keyof z.output<typeof schemas.experiencesSchema>;
})[];
const educationFields = [
  { name: "institution", label: "Institution", kind: "text" },
  { name: "qualification", label: "Qualification", kind: "text" },
  {
    name: "date_label",
    label: "Dates",
    kind: "text",
    help: "Use the factual date label from your source. No dates are inferred.",
  },
  { name: "description", label: "Description", kind: "textarea" },
  { name: "image", label: "Image", kind: "image" },
  { name: "url", label: "Institution URL", kind: "url" },
] satisfies (EditorField & {
  name: keyof z.output<typeof schemas.educationSchema>;
})[];
const certificationsFields = [
  { name: "name", label: "Certificate name", kind: "text" },
  { name: "issuer", label: "Issuer", kind: "text" },
  {
    name: "date_label",
    label: "Completion date",
    kind: "text",
    help: "Use the factual date label from your source. No dates are inferred.",
  },
  { name: "image", label: "Certificate image", kind: "image" },
  { name: "credential_url", label: "Credential URL", kind: "url" },
] satisfies (EditorField & {
  name: keyof z.output<typeof schemas.certificationsSchema>;
})[];
const achievementsFields = [
  { name: "name", label: "Achievement name", kind: "text" },
  { name: "context", label: "Event or issuer", kind: "text" },
  { name: "result", label: "Result", kind: "text" },
  { name: "description", label: "Description", kind: "textarea" },
  { name: "url", label: "Reference URL", kind: "url" },
] satisfies (EditorField & {
  name: keyof z.output<typeof schemas.achievementsSchema>;
})[];
const skill_groupsFields = [
  { name: "name", label: "Group name", kind: "text" },
] satisfies (EditorField & {
  name: keyof z.output<typeof schemas.skill_groupsSchema>;
})[];
const skillsFields = [
  { name: "group_id", label: "Skill group", kind: "select" },
  { name: "name", label: "Skill name", kind: "text" },
  { name: "description", label: "Description", kind: "textarea" },
] satisfies (EditorField & {
  name: keyof z.output<typeof schemas.skillsSchema>;
})[];
const interestsFields = [
  { name: "name", label: "Interest name", kind: "text" },
] satisfies (EditorField & {
  name: keyof z.output<typeof schemas.interestsSchema>;
})[];
const social_linksFields = [
  { name: "label", label: "Link label", kind: "text" },
  {
    name: "icon",
    label: "Icon",
    kind: "select",
    options: ["github", "linkedin", "facebook", "link"],
  },
  { name: "url", label: "Social URL", kind: "url" },
] satisfies (EditorField & {
  name: keyof z.output<typeof schemas.social_linksSchema>;
})[];
const navigation_itemsFields = [
  { name: "label", label: "Link label", kind: "text" },
  { name: "url", label: "Destination", kind: "text" },
  {
    name: "kind",
    label: "Link purpose",
    kind: "select",
    options: ["navigation", "resume", "document"],
  },
] satisfies (EditorField & {
  name: keyof z.output<typeof schemas.navigation_itemsSchema>;
})[];
const section_settingsFields = [
  {
    name: "key",
    label: "Section",
    kind: "select",
    options: [
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
    ],
  },
  { name: "title", label: "Section title", kind: "text" },
  { name: "subtitle", label: "Section introduction", kind: "textarea" },
  {
    name: "visible",
    label: "Display section on homepage",
    kind: "checkbox",
    help: "This controls homepage display. Published records remain readable through the public API.",
  },
] satisfies (EditorField & {
  name: keyof z.output<typeof schemas.section_settingsSchema>;
})[];
const profile_factsFields = [
  { name: "label", label: "Fact label", kind: "text" },
  { name: "value", label: "Fact value", kind: "text" },
  {
    name: "kind",
    label: "Fact type",
    kind: "select",
    options: ["text", "email", "phone"],
  },
  {
    name: "is_public",
    label: "Explicitly publish this fact",
    kind: "checkbox",
    help: "This exposes the value to every visitor and the public API. Private is the default.",
  },
] satisfies (EditorField & {
  name: keyof z.output<typeof schemas.profile_factsSchema>;
})[];
export const collections = {
  project_media: {
    label: "Project galleries",
    titleField: "caption",
    fields: [
      { name: "project_id", label: "Project", kind: "select" },
      { name: "media_id", label: "Public image", kind: "select" },
      { name: "caption", label: "Image caption", kind: "textarea" },
      { name: "sort_order", label: "Display order", kind: "number" },
    ],
    defaults: { project_id: "", media_id: "", caption: "", sort_order: 0 },
  },
  experiences: {
    label: "Experience",
    titleField: "organization",
    fields: [...experiencesFields, ...publication],
    defaults: {
      status: "draft",
      sort_order: 0,
      organization: "",
      role: "",
      date_label: "",
      location: "",
      bullets: "",
      url: "",
    },
  },
  education: {
    label: "Education",
    titleField: "institution",
    fields: [...educationFields, ...publication],
    defaults: {
      status: "draft",
      sort_order: 0,
      institution: "",
      qualification: "",
      date_label: "",
      description: "",
      image: "",
      url: "",
    },
  },
  certifications: {
    label: "Certifications",
    titleField: "name",
    fields: [...certificationsFields, ...publication],
    defaults: {
      status: "draft",
      sort_order: 0,
      name: "",
      issuer: "",
      date_label: "",
      image: "",
      credential_url: "",
    },
  },
  achievements: {
    label: "Achievements",
    titleField: "name",
    fields: [...achievementsFields, ...publication],
    defaults: {
      status: "draft",
      sort_order: 0,
      name: "",
      context: "",
      result: "",
      description: "",
      url: "",
    },
  },
  skill_groups: {
    label: "Skill groups",
    titleField: "name",
    fields: [...skill_groupsFields, ...publication],
    defaults: { status: "draft", sort_order: 0, name: "" },
  },
  skills: {
    label: "Skills",
    titleField: "name",
    fields: [...skillsFields, ...publication],
    defaults: {
      status: "draft",
      sort_order: 0,
      group_id: "",
      name: "",
      description: "",
    },
  },
  interests: {
    label: "Interests",
    titleField: "name",
    fields: [...interestsFields, ...publication],
    defaults: { status: "draft", sort_order: 0, name: "" },
  },
  social_links: {
    label: "Social links",
    titleField: "label",
    fields: [...social_linksFields, ...publication],
    defaults: {
      status: "draft",
      sort_order: 0,
      label: "",
      icon: "github",
      url: "",
    },
  },
  navigation_items: {
    label: "Navigation and resume",
    titleField: "label",
    fields: [...navigation_itemsFields, ...publication],
    defaults: {
      status: "draft",
      sort_order: 0,
      label: "",
      url: "",
      kind: "navigation",
    },
  },
  section_settings: {
    label: "Sections",
    titleField: "title",
    fields: [...section_settingsFields, ...publication],
    defaults: {
      status: "draft",
      sort_order: 0,
      key: "about",
      title: "",
      subtitle: "",
      visible: false,
    },
  },
  profile_facts: {
    label: "Profile and contact facts",
    titleField: "label",
    fields: [
      ...profile_factsFields,
      { name: "sort_order", label: "Display order", kind: "number" as const },
    ],
    defaults: {
      sort_order: 0,
      label: "",
      value: "",
      kind: "text",
      is_public: false,
    },
  },
} satisfies Record<
  schemas.CollectionKind,
  {
    label: string;
    titleField: string;
    fields: EditorField[];
    defaults: Record<string, string | number | boolean>;
  }
>;
