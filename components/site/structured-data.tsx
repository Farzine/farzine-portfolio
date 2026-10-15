import "server-only";
import { serializeJsonLd } from "@/lib/security/metadata";
export function StructuredData({
  data,
  nonce,
}: {
  data: Record<string, unknown>;
  nonce?: string;
}) {
  return (
    <script
      type="application/ld+json"
      nonce={nonce}
      // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD escapes HTML delimiters and has injection regression tests.
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }}
    />
  );
}
