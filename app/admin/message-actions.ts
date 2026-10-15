"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { markMessageRead, deleteMessage } from "@/lib/dal/admin-messages";
import { formFailure } from "@/lib/admin/errors";
import type { FormState } from "@/lib/admin/form-state";
function text(form: FormData, name: string) {
  const value = form.get(name);
  return typeof value === "string" ? value : "";
}
export async function markReadAction(
  _state: FormState,
  form: FormData,
): Promise<FormState> {
  try {
    await markMessageRead(text(form, "id"), text(form, "version"));
    revalidatePath("/admin/messages");
    return { success: "Message marked as read." };
  } catch (error) {
    return formFailure(error);
  }
}
export async function deleteMessageAction(
  _state: FormState,
  form: FormData,
): Promise<FormState> {
  try {
    await deleteMessage(
      text(form, "id"),
      text(form, "version"),
      text(form, "confirmation"),
    );
    revalidatePath("/admin/messages");
  } catch (error) {
    return formFailure(error);
  }
  redirect("/admin/messages?deleted=1");
}
