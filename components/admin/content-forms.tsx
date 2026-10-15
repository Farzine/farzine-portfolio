import { settingsAction, projectAction } from "@/app/admin/actions";
import { EditorForm, type FieldSpec } from "@/components/admin/editor-form";
import type { Database } from "@/lib/types/database";
import type { ProjectInput, SettingsInput } from "@/lib/validations/admin";

type Tables = Database["public"]["Tables"];
type MediaOption = Pick<
  Tables["media_assets"]["Row"],
  "id" | "label" | "kind" | "is_public"
>;
export function mediaOptions(media: MediaOption[], publicOnly = false) {
  return [
    { value: "", label: "No image" },
    ...media
      .filter(
        (asset) => asset.kind === "image" && (!publicOnly || asset.is_public),
      )
      .map((asset) => ({
        value: asset.id,
        label: `${asset.label}${asset.is_public ? "" : " (private)"}`,
      })),
  ];
}
function initialValues(row: Record<string, unknown>) {
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
export function SettingsForm({
  settings,
  media,
}: {
  settings: Tables["site_settings"]["Row"];
  media: MediaOption[];
}) {
  const imageOptions = mediaOptions(media, true);
  const fields: FieldSpec<keyof SettingsInput>[] = [
    {
      name: "display_name",
      label: "Display name",
      required: true,
      maxLength: 100,
    },
    { name: "full_name", label: "Full name", required: true, maxLength: 150 },
    { name: "role_prefix", label: "Role introduction", maxLength: 40 },
    {
      name: "roles",
      label: "Roles",
      type: "textarea",
      hint: "One per line, up to 10. Historical claims are not automatically updated.",
    },
    {
      name: "biography",
      label: "Biography",
      type: "textarea",
      maxLength: 10000,
    },
    {
      name: "profile_media_id",
      label: "Profile image",
      type: "select",
      options: imageOptions,
    },
    { name: "social_heading", label: "Social heading", maxLength: 100 },
    { name: "updated_label", label: "Updated label", maxLength: 100 },
    {
      name: "updated_display",
      label: "Updated display text",
      maxLength: 100,
      hint: "Display text only; saving does not invent a new content date.",
    },
    {
      name: "primary_cta_label",
      label: "Primary action label",
      maxLength: 100,
    },
    { name: "primary_cta_url", label: "Primary action URL", maxLength: 2048 },
    {
      name: "secondary_cta_label",
      label: "Secondary action label",
      maxLength: 100,
    },
    {
      name: "secondary_cta_url",
      label: "Secondary action URL",
      maxLength: 2048,
    },
    { name: "footer_text", label: "Footer", type: "textarea", maxLength: 2000 },
    { name: "seo_title", label: "Default page title", maxLength: 160 },
    {
      name: "seo_description",
      label: "Default description",
      type: "textarea",
      maxLength: 500,
    },
    {
      name: "canonical_url",
      label: "Canonical site URL",
      type: "url",
      maxLength: 2048,
    },
    {
      name: "seo_image_media_id",
      label: "Social preview image",
      type: "select",
      options: imageOptions,
    },
    {
      name: "icon_media_id",
      label: "Site icon",
      type: "select",
      options: imageOptions,
    },
    { name: "twitter_handle", label: "Twitter handle", maxLength: 16 },
  ];
  return (
    <EditorForm
      action={settingsAction}
      fields={fields}
      initial={initialValues(settings)}
      hidden={{ revision: settings.updated_at }}
      submitLabel="Save site settings"
    />
  );
}
export function ProjectForm({
  project,
  media,
}: {
  project?: Tables["projects"]["Row"];
  media: MediaOption[];
}) {
  const fields: FieldSpec<keyof ProjectInput>[] = [
    { name: "title", label: "Title", required: true, maxLength: 200 },
    {
      name: "detail_title",
      label: "Detail heading",
      maxLength: 200,
      hint: "Leave empty to use the title.",
    },
    {
      name: "slug",
      label: "Slug",
      required: true,
      maxLength: 100,
      hint: "Stable lowercase URL. Changing it removes the old detail URL.",
    },
    { name: "summary", label: "Summary", type: "textarea", maxLength: 3000 },
    {
      name: "paragraphs",
      label: "Detailed description",
      type: "textarea",
      hint: "Plain text, one paragraph per line. HTML is displayed as text.",
    },
    {
      name: "technologies",
      label: "Technologies",
      type: "textarea",
      hint: "One technology per line, up to 100.",
    },
    { name: "category", label: "Category", required: true, maxLength: 60 },
    {
      name: "cover_media_id",
      label: "Cover image",
      type: "select",
      options: mediaOptions(media),
    },
    { name: "source_url", label: "Source URL", type: "url", maxLength: 2048 },
    { name: "demo_url", label: "Demo URL", type: "url", maxLength: 2048 },
    {
      name: "download_url",
      label: "Download URL",
      type: "url",
      maxLength: 2048,
    },
    {
      name: "status",
      label: "Status",
      type: "select",
      options: ["draft", "published", "archived"].map((value) => ({
        value,
        label: value,
      })),
    },
    {
      name: "published_at",
      label: "Publication time (UTC)",
      hint: "ISO date/time, e.g. 2026-10-15T00:00:00Z. Required when published; future dates schedule publication.",
    },
    { name: "featured", label: "Featured", type: "checkbox" },
    {
      name: "sort_order",
      label: "Display order",
      type: "number",
      required: true,
      hint: "Lower numbers appear first.",
    },
    { name: "seo_title", label: "Page title", maxLength: 160 },
    {
      name: "seo_description",
      label: "Page description",
      type: "textarea",
      maxLength: 500,
    },
  ];
  return (
    <EditorForm
      action={projectAction}
      fields={fields}
      initial={
        project
          ? initialValues(project)
          : {
              title: "",
              category: "Web",
              status: "draft",
              sort_order: "0",
              published_at: "",
            }
      }
      hidden={{ id: project?.id || "", revision: project?.updated_at || "" }}
      submitLabel={project ? "Save project" : "Create project"}
    />
  );
}
