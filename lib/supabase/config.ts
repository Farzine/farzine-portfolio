import {
  isPublicSupabaseKey,
  supabaseOrigin,
} from "@/lib/security/environment";
export function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;
  if (!isPublicSupabaseKey(key))
    throw new Error(
      "Configure the Supabase publishable/anon key. Secret keys do not belong in NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.",
    );
  return { url: supabaseOrigin(url), key };
}
export function isDevelopmentDemo(
  env: { NODE_ENV?: string; PORTFOLIO_DEMO_MODE?: string } = process.env,
) {
  return env.NODE_ENV === "development" && env.PORTFOLIO_DEMO_MODE === "true";
}
