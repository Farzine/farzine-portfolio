"use server";
import { revalidatePath, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import {
  uploadMedia,
  deleteMedia,
  updateAssetDescription,
} from "@/lib/dal/admin-media";
import { requireAdmin } from "@/lib/auth/require-admin";
import { formFailure, ContentError } from "@/lib/admin/errors";
import type { FormState } from "@/lib/admin/form-state";
function text(form: FormData, name: string) {
  const value = form.get(name);
  return typeof value === "string" ? value : "";
}
export async function uploadMediaAction(
  _state: FormState,
  form: FormData,
): Promise<FormState> {
  try {
    await requireAdmin({ writable: true });
    const file = form.get("file");
    if (!(file instanceof File)) throw new ContentError("Choose a file.");
    await uploadMedia(file, {
      alt_text: text(form, "alt_text"),
      is_public: form.get("is_public") === "on",
    });
    updateTag("portfolio:media_assets");
    revalidatePath("/admin", "layout");
    return { success: "File uploaded and registered in the media library." };
  } catch (error) {
    return formFailure(error);
  }
}
export async function deleteMediaAction(
  _state: FormState,
  form: FormData,
): Promise<FormState> {
  try {
    await deleteMedia(
      text(form, "id"),
      text(form, "version"),
      text(form, "confirmation"),
    );
    updateTag("portfolio:media_assets");
    revalidatePath("/admin", "layout");
  } catch (error) {
    return formFailure(error);
  }
  redirect("/admin/media?deleted=1");
}

export async function saveAssetDescriptionAction(
  _state: FormState,
  form: FormData,
): Promise<FormState> {
  try {
    const result = await updateAssetDescription(
      { alt_text: text(form, "alt_text") },
      text(form, "id"),
      text(form, "version"),
    );
    updateTag("portfolio:media_assets");
    revalidatePath("/", "layout");
    revalidatePath("/admin/media");
    return { success: "Asset description saved.", ...result };
  } catch (error) {
    return formFailure(error);
  }
}
