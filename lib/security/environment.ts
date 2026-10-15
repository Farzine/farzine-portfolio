export function isPublicSupabaseKey(key: string): boolean {
  if (key.startsWith("sb_publishable_")) return true;
  try {
    const payload: unknown = JSON.parse(
      atob(key.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")),
    );
    return (
      typeof payload === "object" &&
      payload !== null &&
      "role" in payload &&
      payload.role === "anon"
    );
  } catch {
    return false;
  }
}
export function supabaseOrigin(value: string): string {
  const url = new URL(value);
  if (
    !["http:", "https:"].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    url.pathname !== "/"
  )
    throw new Error(
      "Configure a Supabase http(s) project origin without credentials or a path.",
    );
  return url.origin;
}
