import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import test from "node:test";

test("trimmed icon CSS covers actual component choices with the exact legacy glyphs", () => {
  const source = readdirSync("components", { recursive: true })
    .filter((file) => file.endsWith(".tsx"))
    .map((file) => readFileSync(`components/${file}`, "utf8"))
    .join("\n");
  const icons = new Set(source.match(/\b(?:bx[ls]?-|ri-)[a-z0-9-]+/g));
  assert.ok(icons.size >= 25);
  const current = readFileSync("app/icons.css", "utf8");
  for (const icon of icons) {
    const legacy = readFileSync(
      icon.startsWith("ri-")
        ? "assets/vendor/remixicon/remixicon.css"
        : "assets/vendor/boxicons/css/boxicons.min.css",
      "utf8",
    );
    const glyph = new RegExp(
      `\\.${icon}:{1,2}before\\s*\\{\\s*content:\\s*(["'][^"']+["'])`,
    );
    assert.equal(current.match(glyph)?.[1], legacy.match(glyph)?.[1], icon);
    assert.ok(current.match(glyph), `Missing glyph: ${icon}`);
  }
  assert.ok(Buffer.byteLength(current) < 6000);
});
