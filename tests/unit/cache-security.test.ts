import assert from "node:assert/strict";
import { publicReadTags } from "../../lib/cache/content-tags";
import { contentSecurityPolicy } from "../../lib/security/csp";
const origin = "https://example.supabase.co";
assert.deepEqual(
  publicReadTags(`${origin}/rest/v1/projects?status=eq.published`, origin),
  ["portfolio:projects"],
);
assert.deepEqual(publicReadTags(`${origin}/rest/v1/skills`, origin), [
  "portfolio:skills",
  "portfolio:skill_groups",
]);
for (const path of [
  "/auth/v1/user",
  "/rest/v1/contact_messages",
  "/rest/v1/admin_profiles",
  "/rest/v1/rpc/submit_contact_message",
])
  assert.deepEqual(publicReadTags(`${origin}${path}`, origin), []);
assert.deepEqual(
  publicReadTags(`${origin}/rest/v1/projects`, origin, "POST"),
  [],
);
assert.deepEqual(
  publicReadTags("https://untrusted.test/rest/v1/projects", origin),
  [],
);
const production = contentSecurityPolicy("fixture-nonce", false, origin);
assert.ok(production.includes("'nonce-fixture-nonce'"));
assert.ok(production.includes("object-src 'none'"));
assert.ok(production.includes("frame-ancestors 'none'"));
assert.ok(!production.includes("unsafe-eval"));
assert.ok(production.includes("style-src 'self' 'unsafe-inline'"));
assert.ok(contentSecurityPolicy("fixture", true).includes("unsafe-eval"));
import { serializeJsonLd, siteOrigin } from "../../lib/security/metadata";
const dangerous = {
  name: "</script><script>window.bad=true</script>\u2028 & < >",
};
const serialized = serializeJsonLd(dangerous);
assert.ok(!serialized.includes("<"));
assert.ok(!serialized.includes("</script>"));
assert.deepEqual(JSON.parse(serialized), dangerous);
assert.equal(
  siteOrigin("https://portfolio.example.test"),
  "https://portfolio.example.test",
);
for (const url of [
  "javascript:alert(1)",
  "https://name:secret@example.test",
  "https://example.test/path",
  "https://example.test/?key=value",
])
  assert.throws(() => siteOrigin(url));

import {
  isPublicSupabaseKey,
  supabaseOrigin,
} from "../../lib/security/environment";
assert.equal(isPublicSupabaseKey("sb_publishable_test-only"), true);
assert.equal(isPublicSupabaseKey("sb_secret_test-only"), false);
const jwt = (role: string) =>
  `header.${Buffer.from(JSON.stringify({ role })).toString("base64url")}.signature`;
assert.equal(isPublicSupabaseKey(jwt("anon")), true);
assert.equal(isPublicSupabaseKey(jwt("service_role")), false);
assert.equal(
  supabaseOrigin("https://example.supabase.co/"),
  "https://example.supabase.co",
);
assert.throws(() => supabaseOrigin("https://name:password@example.test"));
