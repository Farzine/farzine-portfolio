import Link from "next/link";
import { requireAdminPage } from "@/lib/auth/require-admin";
import { collectionLabels } from "@/components/admin/collection-fields";
export default async function ContentIndex() {
  await requireAdminPage();
  return (
    <>
      <h1>Portfolio content</h1>
      <p>
        Edit text, links, ordering and visibility. Personal facts start private.
        Section structure follows the original site.
      </p>
      <ul className="admin-list">
        {Object.entries(collectionLabels).map(([key, label]) => (
          <li key={key}>
            <Link href={`/admin/content/${key}`}>{label}</Link>
          </li>
        ))}
      </ul>
    </>
  );
}
