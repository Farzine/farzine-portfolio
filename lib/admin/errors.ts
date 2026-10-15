import { z } from "zod";
import { AuthorizationError } from "@/lib/auth/require-admin";
import type { FormState } from "./form-state";
export class ContentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ContentError";
  }
}
export function formFailure(error: unknown): FormState {
  if (error instanceof z.ZodError) {
    const errors: Record<string, string[]> = {};
    for (const issue of error.issues) {
      const field = String(
        (issue.path[0] === "value" ? issue.path[1] : issue.path[0]) ?? "form",
      );
      errors[field] ??= [];
      errors[field].push(issue.message);
    }
    return { error: "Check the highlighted fields.", errors };
  }
  if (error instanceof AuthorizationError)
    return {
      error: "Your owner session is missing or expired. Sign in again.",
    };
  if (error instanceof ContentError) return { error: error.message };
  console.error("Admin operation failed", {
    type: error instanceof Error ? error.name : "unknown",
  });
  return { error: "The change could not be saved. Please try again." };
}
