"use client";
import { useActionState, useRef, useId } from "react";
import { deleteProjectAction } from "@/app/admin/actions";
import { FormFeedback } from "./editor";
export function DeleteContent({
  id,
  title,
  version,
  action: serverAction,
  project = false,
}: {
  id: string;
  title: string;
  version: string;
  action: (
    state: import("@/lib/admin/form-state").FormState,
    form: FormData,
  ) => Promise<import("@/lib/admin/form-state").FormState>;
  project?: boolean;
}) {
  const dialogId = useId();
  const dialog = useRef<HTMLDialogElement>(null);
  const [state, action, pending] = useActionState(serverAction, {});
  return (
    <>
      <button
        type="button"
        className="button danger"
        onClick={() => dialog.current?.showModal()}
      >
        Delete {project ? "project" : "item"}
      </button>
      <dialog
        ref={dialog}
        className="confirm-dialog"
        aria-labelledby={`${dialogId}-title`}
      >
        <h2 id={`${dialogId}-title`}>
          Delete this {project ? "project" : "item"}?
        </h2>
        <p>
          This permanently removes this record. Referenced records must be
          removed first. Media files remain in the library.
        </p>
        <p>
          Enter <strong>{title}</strong> to confirm.
        </p>
        <form action={action}>
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="version" value={version} />
          <label htmlFor={`${dialogId}-confirmation`}>
            {project ? "Project title" : "Item title"}
          </label>
          <input
            id={`${dialogId}-confirmation`}
            name="confirmation"
            autoComplete="off"
            required
            aria-describedby={`${dialogId}-result`}
          />
          <div id={`${dialogId}-result`}>
            <FormFeedback state={state} />
          </div>
          <div className="link-row">
            <button type="submit" className="button danger" disabled={pending}>
              {pending ? "Deleting…" : "Permanently delete"}
            </button>
            <button
              type="button"
              className="button secondary"
              disabled={pending}
              onClick={() => dialog.current?.close()}
            >
              Cancel
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}

export function DeleteProject(props: {
  id: string;
  title: string;
  version: string;
}) {
  return <DeleteContent {...props} action={deleteProjectAction} project />;
}
