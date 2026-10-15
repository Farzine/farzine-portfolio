import { z } from "zod";

const configSchema = z.object({
  url: z.url().refine((value) => {
    const url = new URL(value);
    return (
      !url.username &&
      !url.password &&
      !url.search &&
      !url.hash &&
      (url.protocol === "https:" ||
        (url.protocol === "http:" &&
          ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)))
    );
  }),
  key: z
    .string()
    .min(20)
    .refine((value) => {
      if (value.startsWith("sb_secret_")) return false;
      if (value.startsWith("sb_publishable_")) return true;
      try {
        const payload = JSON.parse(
          Buffer.from(value.split(".")[1], "base64url").toString(),
        );
        return payload.role === "anon";
      } catch {
        return false;
      }
    }),
});

type Environment = {
  NODE_ENV?: string;
  NEXT_PUBLIC_SUPABASE_URL?: string;
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?: string;
  PORTFOLIO_USE_DEV_SEED?: string;
};

export function readSupabaseConfig(environment: Environment = process.env) {
  const parsed = configSchema.safeParse({
    url: environment.NEXT_PUBLIC_SUPABASE_URL,
    key: environment.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  });
  if (!parsed.success)
    throw new Error(
      "Configure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY with a project URL and publishable/anon key.",
    );
  return parsed.data;
}

export function isDevelopmentSeedEnabled(
  environment: Environment = process.env,
): boolean {
  if (environment.PORTFOLIO_USE_DEV_SEED !== "true") return false;
  if (!["development", "test"].includes(environment.NODE_ENV || "")) {
    throw new Error(
      "Development seed reads are disabled outside development/test.",
    );
  }
  return true;
}
