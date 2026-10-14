import test from "node:test";
import assert from "node:assert/strict";
import { isDevelopmentDemo } from "../../lib/supabase/config";
test("demo needs explicit opt-in and never runs in production/test", () => {
  assert.equal(
    isDevelopmentDemo({ NODE_ENV: "development", PORTFOLIO_DEMO_MODE: "true" }),
    true,
  );
  for (const NODE_ENV of ["production", "test", undefined])
    assert.equal(
      isDevelopmentDemo({ NODE_ENV, PORTFOLIO_DEMO_MODE: "true" }),
      false,
    );
  assert.equal(isDevelopmentDemo({ NODE_ENV: "development" }), false);
});
