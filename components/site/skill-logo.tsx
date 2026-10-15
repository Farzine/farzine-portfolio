"use client";

import Image from "next/image";
import { useState } from "react";

export function SkillLogo({ src, name }: { src: string; name: string }) {
  const [failed, setFailed] = useState(false);
  return failed ? (
    <span>{name}</span>
  ) : (
    <Image
      src={src}
      alt={name}
      unoptimized
      loading="lazy"
      width={80}
      height={50}
      onError={() => setFailed(true)}
    />
  );
}
