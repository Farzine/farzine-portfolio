import "server-only";
import { z } from "zod";
import { AuthorizationError } from "@/lib/auth/errors";
import { createSessionClient } from "@/lib/supabase/server";

// Call at every privileged DAL/action/handler boundary; never globally cache it.
export async function requireAdmin({ writeCookies = false } = {}) {
  const supabase = await createSessionClient({ writeCookies });
  const { data: identity, error } = await supabase.auth.getClaims();
  const userId = z.uuid().safeParse(identity?.claims.sub);
  if (error || !userId.success) throw new AuthorizationError(401);
  const { data: allowed, error: authorizationError } =
    await supabase.rpc("is_admin");
  if (authorizationError)
    throw new Error("Unable to verify access. Please try again.");
  if (allowed !== true) throw new AuthorizationError(403);
  return { supabase, userId: userId.data };
}
