"use server";

import { revalidatePath } from "next/cache";
import { expirePublicGroups } from "@/lib/cache/invalidate";
import { redirect } from "next/navigation";
import { actionFailure } from "@/lib/admin/action-result";
import { requireAdmin } from "@/lib/auth/require-admin";
import {
  updateSiteSettings,
  saveProject,
  deleteProject,
  saveProjectImage,
  removeProjectImage,
} from "@/lib/dal/admin";
import { createSessionClient } from "@/lib/supabase/server";
import {
  type ActionState,
  loginSchema,
  settingsSchema,
  projectSchema,
  gallerySchema,
  readFields,
} from "@/lib/validations/admin";

function refreshAdmin() {
  revalidatePath("/admin", "layout");
}
export async function loginAction(
  _previous: ActionState,
  form: FormData,
): Promise<ActionState> {
  const result = loginSchema.safeParse(readFields(loginSchema, form));
  if (!result.success) return actionFailure(result.error);
  try {
    const supabase = await createSessionClient({ writeCookies: true });
    const { error } = await supabase.auth.signInWithPassword(result.data);
    if (error)
      return {
        ok: false,
        message:
          "Unable to sign in. Check your credentials or try again later.",
      };
    try {
      await requireAdmin({ writeCookies: true });
    } catch {
      await supabase.auth.signOut({ scope: "local" });
      return {
        ok: false,
        message:
          "Unable to sign in. Check your credentials or try again later.",
      };
    }
  } catch (error) {
    return actionFailure(error);
  }
  redirect("/admin");
}
// Logout is available to any session, including users whose admin access was revoked.
export async function logoutAction(
  _previous: ActionState,
  _form: FormData,
): Promise<ActionState> {
  try {
    const supabase = await createSessionClient({ writeCookies: true });
    const { error } = await supabase.auth.signOut({ scope: "local" });
    if (error)
      return { ok: false, message: "Unable to sign out. Please try again." };
  } catch (error) {
    return actionFailure(error);
  }
  redirect("/admin/login");
}
export async function settingsAction(
  _previous: ActionState,
  form: FormData,
): Promise<ActionState> {
  try {
    await requireAdmin({ writeCookies: true });
    const result = await updateSiteSettings(
      readFields(settingsSchema, form),
      form.get("revision"),
    );
    expirePublicGroups(["settings"]);
    refreshAdmin();
    return {
      ok: true,
      message: "Site settings saved.",
      revision: result.updated_at,
    };
  } catch (error) {
    return actionFailure(error);
  }
}
export async function projectAction(
  _previous: ActionState,
  form: FormData,
): Promise<ActionState> {
  let destination: string | null = null;
  try {
    await requireAdmin({ writeCookies: true });
    const result = await saveProject(
      readFields(projectSchema, form),
      form.get("id"),
      form.get("revision"),
    );
    expirePublicGroups(["projects", "gallery"]);
    refreshAdmin();
    if (form.get("id"))
      return {
        ok: true,
        message: "Project saved.",
        revision: result.updated_at,
      };
    destination = `/admin/projects/${result.id}?created=1`;
  } catch (error) {
    return actionFailure(error);
  }
  redirect(destination);
}
export async function deleteProjectAction(
  _previous: ActionState,
  form: FormData,
): Promise<ActionState> {
  try {
    await requireAdmin({ writeCookies: true });
    await deleteProject(
      form.get("id"),
      form.get("revision"),
      form.get("confirmation"),
    );
    expirePublicGroups(["projects", "gallery"]);
    refreshAdmin();
  } catch (error) {
    return actionFailure(error);
  }
  redirect("/admin/projects?deleted=1");
}
export async function saveGalleryAction(
  _previous: ActionState,
  form: FormData,
): Promise<ActionState> {
  try {
    await requireAdmin({ writeCookies: true });
    await saveProjectImage(readFields(gallerySchema, form));
    expirePublicGroups(["gallery"]);
    refreshAdmin();
    return { ok: true, message: "Gallery image saved." };
  } catch (error) {
    return actionFailure(error);
  }
}
export async function removeGalleryAction(
  _previous: ActionState,
  form: FormData,
): Promise<ActionState> {
  try {
    await requireAdmin({ writeCookies: true });
    if (form.get("confirmation") !== "on")
      return { ok: false, message: "Confirm removal first." };
    await removeProjectImage(form.get("id"), form.get("project_id"));
    expirePublicGroups(["gallery"]);
    refreshAdmin();
    return {
      ok: true,
      message: "Gallery image removed. The media asset is retained.",
    };
  } catch (error) {
    return actionFailure(error);
  }
}
