"use server";
import { storeContactMessage } from "@/lib/dal/contact";
import { formFailure } from "@/lib/admin/errors";
import type { FormState } from "@/lib/admin/form-state";
export async function contactAction(
  _state: FormState,
  form: FormData,
): Promise<FormState> {
  const text = (name: string) => {
    const value = form.get(name);
    return typeof value === "string" ? value : "";
  };
  try {
    await storeContactMessage({
      name: text("name"),
      email: text("email"),
      message: text("message"),
      company: text("company"),
    });
    return {
      success:
        "Your message was stored for the portfolio owner. No email notification was sent.",
    };
  } catch (error) {
    return formFailure(error);
  }
}
