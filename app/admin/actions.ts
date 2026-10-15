"use server";

import { revalidatePath } from "next/cache";
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

function refreshPublic(slugs: (string | null)[] = []) {
  revalidatePath("/");
  revalidatePath("/projects");
  for (const slug of new Set(slugs))
    if (slug) revalidatePath(`/projects/${slug}`);
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
    refreshPublic();
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
    refreshPublic([result.oldSlug, result.slug]);
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
    const project = await deleteProject(
      form.get("id"),
      form.get("revision"),
      form.get("confirmation"),
    );
    refreshPublic([project.slug]);
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
    const slug = await saveProjectImage(readFields(gallerySchema, form));
    refreshPublic([slug]);
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
    revalidatePath("/projects/[slug]", "page");
    refreshPublic();
    return {
      ok: true,
      message: "Gallery image removed. The media asset is retained.",
    };
  } catch (error) {
    return actionFailure(error);
  }
}
