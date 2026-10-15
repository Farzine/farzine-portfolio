"use server";
import { revalidatePath } from "next/cache";
import { expirePublicGroups } from "@/lib/cache/invalidate";
import { collectionGroups } from "@/lib/cache/public-groups";
import { requireAdmin } from "@/lib/auth/require-admin";
import { actionFailure } from "@/lib/admin/action-result";
import { saveCollection, deleteCollection } from "@/lib/dal/collections";
import {
  collectionSchemas,
  collectionNameSchema,
} from "@/lib/validations/collections";
import { type ActionState, readFields } from "@/lib/validations/admin";
export async function saveCollectionAction(
  _previous: ActionState,
  form: FormData,
): Promise<ActionState> {
  try {
    await requireAdmin({ writeCookies: true });
    const name = collectionNameSchema.parse(form.get("collection"));
    const result = await saveCollection(
      name,
      form.get("id"),
      form.get("revision"),
      readFields(collectionSchemas[name], form),
    );
    expirePublicGroups(collectionGroups[name]);
    revalidatePath(`/admin/content/${name}`);
    return { ok: true, message: "Content saved.", revision: result.revision };
  } catch (error) {
    return actionFailure(error);
  }
}
export async function deleteCollectionAction(
  _previous: ActionState,
  form: FormData,
): Promise<ActionState> {
  try {
    await requireAdmin({ writeCookies: true });
    const name = collectionNameSchema.parse(form.get("collection"));
    await deleteCollection(
      name,
      form.get("id"),
      form.get("revision"),
      form.get("confirmation"),
    );
    expirePublicGroups(collectionGroups[name]);
    revalidatePath(`/admin/content/${name}`);
    return { ok: true, message: "Item deleted." };
  } catch (error) {
    return actionFailure(error);
  }
}
