import Link from "next/link";
import { collections } from "@/lib/admin/collections";
export default function ContentPage() {
  return (
    <>
      <p className="eyebrow">Content / Collections</p>
      <h1>Portfolio content</h1>
      <p className="muted">
        Publish items individually. Sections control homepage visibility and
        order. Contact facts remain private until explicitly enabled.
      </p>
      <div className="admin-counts">
        {Object.entries(collections).map(([kind, collection]) => (
          <Link
            className="admin-stat"
            key={kind}
            href={`/admin/content/${kind}`}
          >
            {collection.label}
            <span className="text-link">Manage →</span>
          </Link>
        ))}
      </div>
    </>
  );
}
