import Image from "next/image";
import type { PublicMedia } from "@/lib/content/public-model";

export function Media({
  media,
  sizes = "(min-width: 1200px) 340px, (min-width: 768px) 45vw, 90vw",
  className,
  alt,
}: {
  media: PublicMedia | null;
  sizes?: string;
  className?: string;
  alt?: string;
}) {
  if (media?.kind !== "image") return null;
  return (
    <Image
      src={media.src}
      unoptimized={media.src.startsWith("/admin/media/")}
      alt={alt ?? media.alt}
      width={media.width}
      height={media.height}
      sizes={sizes}
      className={className}
    />
  );
}
