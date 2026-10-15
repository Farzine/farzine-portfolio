import { SettingsForm } from "@/components/admin/content-forms";
import { getAdminSettings, getAdminMedia } from "@/lib/dal/admin";
export default async function SettingsPage() {
  const [settings, media] = await Promise.all([
    getAdminSettings(),
    getAdminMedia(),
  ]);
  return (
    <>
      <h1>Site settings</h1>
      <p>
        These fields are public. Personal contact facts and their visibility are
        managed separately. Select public images for the profile and site
        metadata.
      </p>
      <SettingsForm settings={settings} media={media} />
    </>
  );
}
