import "server-only";
import { createSessionClient } from "@/lib/supabase/server";
export class AuthorizationError extends Error {
  constructor() {
    super("Owner authorization required.");
    this.name = "AuthorizationError";
  }
}
export async function requireAdmin({ writable = false } = {}) {
  const supabase = await createSessionClient({ writable });
  // getUser verifies with Auth and observes account revocation; never trust getSession.
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) throw new AuthorizationError();
  const { data: membership, error } = await supabase
    .from("admin_profiles")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (error || !membership) throw new AuthorizationError();
  return { supabase, userId: user.id };
}
