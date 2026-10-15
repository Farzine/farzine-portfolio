"use client";
import { useActionState } from "react";
import { markReadAction } from "@/app/admin/message-actions";
import { FormFeedback } from "./editor";
export function MarkMessageRead({
  id,
  version,
}: {
  id: string;
  version: string;
}) {
  const [state, action, pending] = useActionState(markReadAction, {});
  return (
    <form action={action}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="version" value={version} />
      <FormFeedback state={state} />
      <button className="button secondary" disabled={pending} type="submit">
        {pending ? "Updating…" : "Mark as read"}
      </button>
    </form>
  );
}
