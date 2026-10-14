export function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;
  return { url, key };
}
export function isDevelopmentDemo(
  env: { NODE_ENV?: string; PORTFOLIO_DEMO_MODE?: string } = process.env,
) {
  return env.NODE_ENV === "development" && env.PORTFOLIO_DEMO_MODE === "true";
}
