import assert from "node:assert/strict";
import test from "node:test";
import {
  readSupabaseConfig,
  useDevelopmentSeed,
} from "../../lib/security/runtime-config";

test("seed reads require explicit opt-in and cannot operate in production", () => {
  assert.equal(useDevelopmentSeed({ NODE_ENV: "development" }), false);
  assert.equal(
    useDevelopmentSeed({
      NODE_ENV: "development",
      PORTFOLIO_USE_DEV_SEED: "true",
    }),
    true,
  );
  assert.equal(
    useDevelopmentSeed({ NODE_ENV: "test", PORTFOLIO_USE_DEV_SEED: "true" }),
    true,
  );
  assert.throws(() =>
    useDevelopmentSeed({
      NODE_ENV: "production",
      PORTFOLIO_USE_DEV_SEED: "true",
    }),
  );
});

test("configuration rejects missing, secret/service and unsafe URL values without echoing them", () => {
  const valid = {
    NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_test_value",
  };
  assert.equal(readSupabaseConfig(valid).url, valid.NEXT_PUBLIC_SUPABASE_URL);
  assert.throws(() => readSupabaseConfig({}));
  for (const key of [
    "sb_secret_forbidden_value",
    `x.${Buffer.from('{"role":"service_role"}').toString("base64url")}.x`,
  ]) {
    assert.throws(
      () =>
        readSupabaseConfig({
          ...valid,
          NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: key,
        }),
      (error) => error instanceof Error && !error.message.includes(key),
    );
  }
  assert.throws(() =>
    readSupabaseConfig({
      ...valid,
      NEXT_PUBLIC_SUPABASE_URL: "http://remote.example.com",
    }),
  );
  assert.throws(() =>
    readSupabaseConfig({
      ...valid,
      NEXT_PUBLIC_SUPABASE_URL: "javascript:alert(1)",
    }),
  );
  assert.throws(() =>
    readSupabaseConfig({
      ...valid,
      NEXT_PUBLIC_SUPABASE_URL: "https://user:password@example.supabase.co",
    }),
  );
  const anon = `x.${Buffer.from('{"role":"anon"}').toString("base64url")}.x`;
  assert.equal(
    readSupabaseConfig({ ...valid, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: anon })
      .key,
    anon,
  );
});
