"use server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/require-admin";
import { actionFailure } from "@/lib/admin/action-result";
import {
  createPublicCopy,
  deleteMedia,
  updateMediaText,
} from "@/lib/dal/media";
import type { ActionState } from "@/lib/validations/admin";
function refresh() {
  revalidatePath("/");
  revalidatePath("/projects/[slug]", "page");
  revalidatePath("/admin", "layout");
}
export async function updateMediaAction(
  _previous: ActionState,
  form: FormData,
): Promise<ActionState> {
  try {
    await requireAdmin({ writeCookies: true });
    const revision = await updateMediaText(
      form.get("id"),
      form.get("revision"),
      { label: form.get("label"), alt_text: form.get("alt_text") },
    );
    refresh();
    return { ok: true, message: "Media description saved.", revision };
  } catch (error) {
    return actionFailure(error);
  }
}
export async function promoteMediaAction(
  _previous: ActionState,
  form: FormData,
): Promise<ActionState> {
  try {
    await requireAdmin({ writeCookies: true });
    await createPublicCopy(form.get("id"), form.get("confirmation"));
    refresh();
    return {
      ok: true,
      message:
        "Public copy created. Select it in your content to publish the file.",
    };
  } catch (error) {
    return actionFailure(error);
  }
}
export async function deleteMediaAction(
  _previous: ActionState,
  form: FormData,
): Promise<ActionState> {
  try {
    await requireAdmin({ writeCookies: true });
    await deleteMedia(
      form.get("id"),
      form.get("revision"),
      form.get("confirmation"),
    );
    refresh();
    return { ok: true, message: "Media removed." };
  } catch (error) {
    revalidatePath("/admin/media");
    return actionFailure(error);
  }
}
