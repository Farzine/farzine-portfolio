"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

export function SkillLogo({ src, name }: { src: string; name: string }) {
  const [failed, setFailed] = useState(false);
  const [pending, setPending] = useState(false);
  const image = useRef<HTMLImageElement>(null);
  useEffect(() => {
    setFailed(false);
    setPending(!image.current?.complete);
    if (image.current?.complete && !image.current.naturalWidth) setFailed(true);
  }, []);
  return failed ? (
    <span>{name}</span>
  ) : (
    <>
      <Image
        ref={image}
        src={src}
        alt={name}
        unoptimized
        loading="lazy"
        width={80}
        height={50}
        className={pending ? "skill-logo-loading" : undefined}
        onLoad={() => setPending(false)}
        onError={() => setFailed(true)}
      />
      {pending && (
        <span className="skill-logo-pending" aria-hidden="true">
          {name}
        </span>
      )}
    </>
  );
}
