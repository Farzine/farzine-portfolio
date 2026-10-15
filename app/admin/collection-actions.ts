"use server";
import { revalidatePath, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { contentTag } from "@/lib/cache/content-tags";
import { collections } from "@/lib/admin/collections";
import {
  collectionKind,
  type CollectionKind,
} from "@/lib/validations/admin-collections";
import { requireAdmin } from "@/lib/auth/require-admin";
import { saveCollection, deleteCollection } from "@/lib/dal/admin-collections";
import { formFailure } from "@/lib/admin/errors";
import type { FormState } from "@/lib/admin/form-state";
function field(form: FormData, name: string) {
  const value = form.get(name);
  return typeof value === "string" ? value : "";
}
export async function saveCollectionAction(
  kindInput: string,
  _state: FormState,
  form: FormData,
): Promise<FormState> {
  try {
    await requireAdmin({ writable: true });
    const kind = collectionKind.parse(kindInput);
    const value: Record<string, unknown> = {};
    for (const input of collections[kind].fields) {
      const raw = field(form, input.name);
      value[input.name] =
        input.kind === "checkbox"
          ? raw === "on"
          : input.kind === "number"
            ? raw.trim()
              ? Number(raw)
              : Number.NaN
            : input.kind === "lines"
              ? raw
                  .split(/\r?\n/)
                  .map((line) => line.trim())
                  .filter(Boolean)
              : raw;
    }
    const result = await saveCollection(
      { kind, value },
      field(form, "id") || null,
      field(form, "version") || null,
    );
    updateTag(contentTag(kind));
    revalidatePath("/", "layout");
    revalidatePath(`/admin/content/${kind}`);
    return { success: "Item saved.", ...result };
  } catch (error) {
    return formFailure(error);
  }
}
export async function deleteCollectionAction(
  kindInput: string,
  _state: FormState,
  form: FormData,
): Promise<FormState> {
  let kind: CollectionKind;
  try {
    kind = await deleteCollection(
      kindInput,
      field(form, "id"),
      field(form, "version"),
      field(form, "confirmation"),
    );
    updateTag(contentTag(kind));
    revalidatePath("/", "layout");
    revalidatePath(`/admin/content/${kind}`);
  } catch (error) {
    return formFailure(error);
  }
  redirect(`/admin/content/${kind}?deleted=1`);
}
