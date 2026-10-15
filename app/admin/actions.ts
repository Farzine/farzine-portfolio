"use server";
import { revalidatePath, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { createSessionClient } from "@/lib/supabase/server";
import { getSupabaseConfig, isDevelopmentDemo } from "@/lib/supabase/config";
import { requireAdmin, AuthorizationError } from "@/lib/auth/require-admin";
import { saveProject, deleteProject, saveSettings } from "@/lib/dal/admin";
import { loginSchema } from "@/lib/validations/admin-content";
import { formFailure } from "@/lib/admin/errors";
import type { FormState } from "@/lib/admin/form-state";

function string(form: FormData, name: string) {
  const value = form.get(name);
  return typeof value === "string" ? value : "";
}
function revision(form: FormData) {
  return string(form, "version") || null;
}
export async function loginAction(
  _state: FormState,
  form: FormData,
): Promise<FormState> {
  if (isDevelopmentDemo())
    return {
      error:
        "Development preview is read-only. Disable demo mode before signing in.",
    };
  if (!getSupabaseConfig())
    return {
      error: "Supabase is not configured. Follow the setup documentation.",
    };
  const parsed = loginSchema.safeParse({
    email: string(form, "email"),
    password: string(form, "password"),
  });
  if (!parsed.success) return formFailure(parsed.error);
  const supabase = await createSessionClient({ writable: true });
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error)
    return {
      error:
        error.status === 429
          ? "Too many sign-in attempts. Please wait before trying again."
          : "Unable to sign in with an authorized owner account.",
    };
  try {
    await requireAdmin({ writable: true });
  } catch {
    const { error: signOutError } = await supabase.auth.signOut({
      scope: "local",
    });
    if (signOutError)
      console.error("Non-admin session cleanup failed", {
        code: signOutError.code,
      });
    return { error: "Unable to sign in with an authorized owner account." };
  }
  redirect("/admin");
}
export async function logoutAction(
  _state: FormState,
  _form: FormData,
): Promise<FormState> {
  if (!getSupabaseConfig()) redirect("/admin/login");
  const supabase = await createSessionClient({ writable: true });
  // Sign-out only clears this browser's session, including expired/non-admin sessions.
  try {
    await requireAdmin({ writable: true });
  } catch (error) {
    if (!(error instanceof AuthorizationError)) return formFailure(error);
  }
  const { error } = await supabase.auth.signOut({ scope: "local" });
  if (error) return { error: "Could not sign out. Please try again." };
  redirect("/admin/login");
}
export async function saveProjectAction(
  _state: FormState,
  form: FormData,
): Promise<FormState> {
  try {
    const result = await saveProject(
      {
        title: string(form, "title"),
        slug: string(form, "slug"),
        summary: string(form, "summary"),
        details: string(form, "details"),
        category: string(form, "category"),
        technologies: string(form, "technologies")
          .split(",")
          .map((value) => value.trim())
          .filter(Boolean),
        cover_image: string(form, "cover_image"),
        cover_alt: string(form, "cover_alt"),
        repository_url: string(form, "repository_url"),
        demo_url: string(form, "demo_url"),
        download_url: string(form, "download_url"),
        featured: form.get("featured") === "on",
        sort_order: string(form, "sort_order").trim()
          ? Number(string(form, "sort_order"))
          : Number.NaN,
        status: string(form, "status"),
        seo_title: string(form, "seo_title"),
        seo_description: string(form, "seo_description"),
      },
      string(form, "id") || null,
      revision(form),
    );
    updateTag("portfolio:projects");
    revalidatePath("/");
    revalidatePath("/projects");
    revalidatePath(`/projects/${result.slug}`);
    if (result.oldSlug && result.oldSlug !== result.slug)
      revalidatePath(`/projects/${result.oldSlug}`);
    revalidatePath("/admin/projects");
    revalidatePath(`/admin/projects/${result.id}`);
    return {
      success: "Project saved.",
      id: result.id,
      version: result.updated_at,
      values: result.values,
    };
  } catch (error) {
    return formFailure(error);
  }
}
export async function deleteProjectAction(
  _state: FormState,
  form: FormData,
): Promise<FormState> {
  try {
    const slug = await deleteProject(
      string(form, "id"),
      string(form, "version"),
      string(form, "confirmation"),
    );
    updateTag("portfolio:projects");
    revalidatePath("/");
    revalidatePath("/projects");
    revalidatePath(`/projects/${slug}`);
    revalidatePath("/admin/projects");
  } catch (error) {
    return formFailure(error);
  }
  redirect("/admin/projects?deleted=1");
}
export async function saveSettingsAction(
  _state: FormState,
  form: FormData,
): Promise<FormState> {
  try {
    const result = await saveSettings(
      {
        name: string(form, "name"),
        contact_form_enabled: form.get("contact_form_enabled") === "on",
        orbit_enabled: form.get("orbit_enabled") === "on",
        headline: string(form, "headline"),
        summary: string(form, "summary"),
        biography: string(form, "biography"),
        profile_image: string(form, "profile_image"),
        favicon_image: string(form, "favicon_image"),
        social_preview_image: string(form, "social_preview_image"),
        hero_visual_caption: string(form, "hero_visual_caption"),
        last_updated_label: string(form, "last_updated_label"),
        show_last_updated: form.get("show_last_updated") === "on",
        primary_cta_label: string(form, "primary_cta_label"),
        primary_cta_href: string(form, "primary_cta_href"),
        secondary_cta_label: string(form, "secondary_cta_label"),
        secondary_cta_href: string(form, "secondary_cta_href"),
        footer_text: string(form, "footer_text"),
        seo_title: string(form, "seo_title"),
        seo_description: string(form, "seo_description"),
        status: string(form, "status"),
      },
      revision(form),
    );
    updateTag("portfolio:site_settings");
    revalidatePath("/", "layout");
    revalidatePath("/admin/settings");
    return {
      success: "Site settings saved.",
      version: result.updated_at,
      values: result.values,
    };
  } catch (error) {
    return formFailure(error);
  }
}
