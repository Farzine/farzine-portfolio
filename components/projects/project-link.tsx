"use client";
import { defaultPublicCopy, type PublicCopy } from "@/lib/content/public-copy";

import Link from "next/link";
import { type ReactNode, useRef } from "react";

export function ProjectLink({
  href,
  title,
  children,
  details,
  copy = defaultPublicCopy,
}: {
  href: string;
  title: string;
  children: ReactNode;
  details: ReactNode;
  copy?: PublicCopy;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  return (
    <>
      <Link
        className="project-image-link"
        href={href}
        aria-label={`${copy.projectDetails}: ${title}`}
        aria-haspopup="dialog"
        onClick={(event) => {
          if (
            event.button !== 0 ||
            event.ctrlKey ||
            event.metaKey ||
            event.shiftKey ||
            event.altKey ||
            !dialog.current?.showModal
          )
            return;
          event.preventDefault();
          dialog.current.showModal();
        }}
      >
        {children}
      </Link>
      <dialog
        ref={dialog}
        className="project-dialog"
        aria-label={title}
        onClick={(event) => {
          if (event.target === event.currentTarget) dialog.current?.close();
        }}
        onKeyDown={(event) => {
          if (event.key === "Escape") dialog.current?.close();
        }}
      >
        <div className="project-dialog-content">
          <button
            type="button"
            className="dialog-close"
            aria-label={copy.closeProject}
            onClick={() => dialog.current?.close()}
          >
            ×
          </button>
          {details}
          <Link className="project-page-link" href={href}>
            {copy.openProject}
          </Link>
        </div>
      </dialog>
    </>
  );
}
