import { cache } from "react";
import "server-only";
import { redirect } from "next/navigation";
import { requireAdmin, AuthorizationError } from "./require-admin";
import { getSupabaseConfig } from "@/lib/supabase/config";
export const requireAdminPage = cache(async () => {
  if (!getSupabaseConfig()) redirect("/admin/login");
  try {
    return await requireAdmin();
  } catch (error) {
    if (error instanceof AuthorizationError) redirect("/admin/login");
    throw error;
  }
});
