import type {
  ProjectInput,
  SettingsInput,
} from "@/lib/validations/admin-content";
export type EditorField = {
  name: string;
  label: string;
  kind?:
    | "text"
    | "textarea"
    | "lines"
    | "number"
    | "checkbox"
    | "select"
    | "image"
    | "url";
  required?: boolean;
  maxLength?: number;
  help?: string;
  options?: readonly (string | { value: string; label: string })[];
};
const states = ["draft", "published", "archived"] as const;
export const projectFields = [
  { name: "title", label: "Title", required: true, maxLength: 180 },
  {
    name: "slug",
    label: "Slug",
    required: true,
    maxLength: 180,
    help: "Use lowercase letters, numbers and hyphens. Earlier URLs redirect to the current published project; drafts and archives remain private.",
  },
  {
    name: "summary",
    label: "Summary",
    kind: "textarea",
    maxLength: 1200,
    help: "Required before publishing.",
  },
  {
    name: "details",
    label: "Project details",
    kind: "textarea",
    maxLength: 30000,
    help: "Plain text. Separate paragraphs with a blank line.",
  },
  { name: "category", label: "Category", maxLength: 80 },
  {
    name: "technologies",
    label: "Technologies",
    help: "Comma-separated names, up to 40.",
  },
  { name: "cover_image", label: "Cover image", kind: "image" },
  { name: "cover_alt", label: "Cover image description", maxLength: 400 },
  { name: "repository_url", label: "Source code URL", kind: "url" },
  { name: "demo_url", label: "Demo URL", kind: "url" },
  { name: "download_url", label: "Download URL", kind: "url" },
  {
    name: "status",
    label: "Publication status",
    kind: "select",
    options: states,
  },
  { name: "featured", label: "Feature on homepage", kind: "checkbox" },
  {
    name: "sort_order",
    label: "Display order",
    kind: "number",
    help: "Lower numbers appear first, from 0 to 10000.",
  },
  { name: "seo_title", label: "SEO title", maxLength: 160 },
  {
    name: "seo_description",
    label: "SEO description",
    kind: "textarea",
    maxLength: 320,
  },
] satisfies (EditorField & { name: keyof ProjectInput })[];
export const settingsFields = [
  {
    name: "orbit_enabled",
    label: "Offer optional interactive profile orbit",
    kind: "checkbox",
    help: "Loads only when a desktop visitor activates it. Portrait and content remain available without graphics.",
  },
  {
    name: "contact_form_enabled",
    label: "Enable stored contact messages",
    kind: "checkbox",
    help: "Requires a server-only Supabase secret key and a published, visible Contact section. No email notification is sent.",
  },
  { name: "name", label: "Name", required: true, maxLength: 120 },
  { name: "headline", label: "Headline", maxLength: 200 },
  {
    name: "summary",
    label: "Hero introduction",
    kind: "textarea",
    maxLength: 600,
  },
  { name: "biography", label: "Biography", kind: "textarea", maxLength: 10000 },
  { name: "profile_image", label: "Profile image", kind: "image" },
  {
    name: "favicon_image",
    label: "Site icon",
    kind: "image",
    help: "Prefer a square image. Leave empty to use the original icon.",
  },
  {
    name: "social_preview_image",
    label: "Default social preview image",
    kind: "image",
  },
  {
    name: "hero_visual_caption",
    label: "Profile image caption",
    maxLength: 240,
  },
  { name: "primary_cta_label", label: "Primary action label", maxLength: 80 },
  {
    name: "primary_cta_href",
    label: "Primary action destination",
    kind: "select",
    options: ["/projects", "/#about", "/#contact"],
  },
  {
    name: "secondary_cta_label",
    label: "Secondary action label",
    maxLength: 80,
  },
  {
    name: "secondary_cta_href",
    label: "Secondary action destination",
    kind: "select",
    options: ["/#contact", "/#links"],
  },
  { name: "footer_text", label: "Footer text", maxLength: 400 },
  { name: "seo_title", label: "Default SEO title", maxLength: 160 },
  {
    name: "seo_description",
    label: "Default SEO description",
    kind: "textarea",
    maxLength: 320,
  },
  {
    name: "last_updated_label",
    label: "Last updated label",
    maxLength: 120,
    help: "Preserve factual dates. This label is not updated automatically.",
  },
  {
    name: "show_last_updated",
    label: "Show last updated label publicly",
    kind: "checkbox",
  },
  {
    name: "status",
    label: "Site identity publication status",
    kind: "select",
    options: states,
  },
] satisfies (EditorField & { name: keyof SettingsInput })[];
