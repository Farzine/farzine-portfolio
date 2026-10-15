import "server-only";
import { z } from "zod";
import { AuthorizationError } from "@/lib/auth/errors";
import { ContentError } from "@/lib/dal/admin";
import type { ActionState } from "@/lib/validations/admin";
export function actionFailure(error: unknown): ActionState {
  if (error instanceof z.ZodError)
    return {
      ok: false,
      message: "Check the highlighted fields.",
      errors: z.flattenError(error).fieldErrors,
    };
  if (error instanceof AuthorizationError || error instanceof ContentError)
    return { ok: false, message: error.message };
  console.error("Admin request failed", {
    kind: error instanceof Error ? error.name : "unknown",
  });
  return {
    ok: false,
    message: "This request could not be completed. Please try again.",
  };
}
