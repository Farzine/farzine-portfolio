import assert from "node:assert/strict";
import test from "node:test";
import { publicRecords } from "../fixtures/public-records";
import { toPublicPortfolio } from "../../lib/content/public-model";
import { contentSecurityPolicy } from "../../lib/security/headers";
import {
  serializeStructuredData,
  structuredPortfolio,
  sitemapUrls,
} from "../../lib/content/seo";
import {
  collectionGroups,
  publicGroups,
  publicTag,
} from "../../lib/cache/public-groups";

function portfolio() {
  return toPublicPortfolio(publicRecords(), null);
}

test("production CSP admits only nonced scripts and separates safe style attributes", () => {
  const nonce = "pR7LQCVSTFeKg5gGGgmpGW4Y";
  const policy = contentSecurityPolicy(nonce, {
    storageUrl: "http://127.0.0.1:54321",
    secureTransport: true,
  });
  const directives = new Map(
    policy.split("; ").map((part) => {
      const [key, ...values] = part.split(" ");
      return [key, values.join(" ")];
    }),
  );
  assert.ok(directives.get("script-src")?.includes(`'nonce-${nonce}'`));
  assert.ok(!directives.get("script-src")?.includes("unsafe-inline"));
  assert.ok(!directives.get("script-src")?.includes("unsafe-eval"));
  assert.equal(directives.get("style-src-attr"), "'unsafe-inline'");
  assert.equal(directives.get("object-src"), "'none'");
  assert.equal(directives.get("base-uri"), "'none'");
  assert.equal(directives.get("frame-ancestors"), "'none'");
  assert.equal(directives.get("connect-src"), "'self'");
  assert.ok(directives.get("img-src")?.includes("http://127.0.0.1:54321"));
  assert.ok(
    !contentSecurityPolicy(nonce, {
      storageUrl: "http://attacker.invalid",
    }).includes("attacker.invalid"),
  );
  assert.throws(() => contentSecurityPolicy("bad'; script-src *"));
});

test("SEO contains only public published DTOs and serializes script terminators as JSON data", () => {
  const publicData = portfolio();
  assert.equal(publicData.projects.length, 15);
  const urls = sitemapUrls(publicData);
  assert.equal(urls.length, 17);
  assert.ok(
    urls.every((url) => !url.includes("/admin") && !url.includes("private")),
  );
  const graph = structuredPortfolio(publicData);
  const json = serializeStructuredData(graph);
  assert.ok(!json.includes("birthday") && !json.includes("published_at"));
  const attack = "</script><script>globalThis.injected=1</script>\u2028\u2029";
  const roundtrip = serializeStructuredData({ name: attack });
  assert.ok(!roundtrip.includes("<"));
  assert.equal(JSON.parse(roundtrip).name, attack);
  const project = structuredPortfolio(publicData, publicData.projects[0]);
  assert.equal(project["@graph"][1]["@type"], "CreativeWork");
  assert.deepEqual(
    sitemapUrls({
      ...publicData,
      settings: { ...publicData.settings, canonicalUrl: null },
    }),
    [],
  );
});

test("cache tag names are bounded and only explicitly public groups are mapped", () => {
  for (const group of publicGroups) {
    assert.ok(publicTag(group).length < 256);
    assert.ok(!/admin|session|contact_messages/.test(group));
  }
  assert.deepEqual(collectionGroups.skill_groups, ["skillGroups", "skills"]);
  assert.equal(new Set(publicGroups).size, 17);
});
