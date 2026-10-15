import "server-only";
import { createClient } from "@supabase/supabase-js";
import { createHmac } from "node:crypto";
import { isIP } from "node:net";
import { headers } from "next/headers";
import { z } from "zod";
import { getSupabaseConfig, isDevelopmentDemo } from "@/lib/supabase/config";
import { contactInputSchema } from "@/lib/validations/contact";
import { ContentError } from "@/lib/admin/errors";
import type { Database } from "@/lib/types/database.generated";
export function contactAvailable() {
  return (
    !isDevelopmentDemo() &&
    Boolean(getSupabaseConfig() && process.env.SUPABASE_SECRET_KEY)
  );
}
export async function storeContactMessage(input: unknown) {
  const value = contactInputSchema.parse(input);
  const config = getSupabaseConfig();
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!config || !key || isDevelopmentDemo())
    throw new ContentError(
      "Contact intake is unavailable. Use the published contact links.",
    );
  const requestHeaders = await headers();
  // Trust Vercel's overwritten header only on Vercel; elsewhere use a shared safe limit.
  const candidate =
    process.env.VERCEL === "1"
      ? (requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "")
      : "";
  const address = isIP(candidate) ? candidate : "shared-contact-intake";
  const fingerprint = createHmac("sha256", key).update(address).digest("hex");
  const db = createClient<Database>(config.url, key, {
    global: {
      fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }),
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
  const { data, error } = await db.rpc("submit_contact_message", {
    sender_name: value.name,
    sender_email: value.email,
    body_text: value.message,
    rate_key: fingerprint,
  });
  if (error) {
    console.error("Contact storage failed", { code: error.code });
    throw new ContentError(
      "Your message was not confirmed as stored. Please try again or use a contact link.",
    );
  }
  const result = z
    .enum(["stored", "disabled", "invalid", "rate_limited"])
    .parse(data);
  if (result === "rate_limited")
    throw new ContentError(
      "Too many messages have been submitted. Please try later or use a contact link.",
    );
  if (result !== "stored")
    throw new ContentError(
      "Contact intake is unavailable. Use the published contact links.",
    );
}
