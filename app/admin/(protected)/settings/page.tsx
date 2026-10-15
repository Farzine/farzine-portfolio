import { getAdminSettings } from "@/lib/dal/admin";
import { getAdminImageChoices } from "@/lib/dal/admin-media";
import { settingsFields } from "@/lib/admin/fields";
import { ContentEditor } from "@/components/admin/editor";
import { saveSettingsAction } from "@/app/admin/actions";
export default async function SettingsPage() {
  const settings = await getAdminSettings();
  const values = settings
    ? {
        name: settings.name,
        contact_form_enabled: settings.contact_form_enabled,
        orbit_enabled: settings.orbit_enabled,
        headline: settings.headline,
        summary: settings.summary,
        biography: settings.biography,
        profile_image: settings.profile_image,
        favicon_image: settings.favicon_image,
        social_preview_image: settings.social_preview_image,
        hero_visual_caption: settings.hero_visual_caption,
        last_updated_label: settings.last_updated_label,
        show_last_updated: settings.show_last_updated,
        primary_cta_label: settings.primary_cta_label,
        primary_cta_href: settings.primary_cta_href,
        secondary_cta_label: settings.secondary_cta_label,
        secondary_cta_href: settings.secondary_cta_href,
        footer_text: settings.footer_text,
        seo_title: settings.seo_title,
        seo_description: settings.seo_description,
        status: settings.status,
      }
    : {
        name: "",
        orbit_enabled: true,
        status: "draft",
        primary_cta_href: "/projects",
        secondary_cta_href: "/#contact",
      };
  return (
    <>
      <p className="eyebrow">Site / Identity and content</p>
      <h1>Site settings</h1>
      <p className="muted">
        Publishing this record makes the identity and biography public. Sections
        and items also need publication. Edit contact facts, section controls
        and links in Content collections.
      </p>
      <ContentEditor
        action={saveSettingsAction}
        fields={settingsFields}
        values={values}
        images={await getAdminImageChoices()}
        version={settings?.updated_at}
      />
    </>
  );
}
