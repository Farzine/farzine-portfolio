import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { runInNewContext } from "node:vm";
import { themeBootstrap } from "../../lib/theme";

test("pre-paint theme applies only an explicit light preference and tolerates blocked storage", () => {
  for (const value of [null, "dark", "light", "system", "<script>"]) {
    const document = { documentElement: { dataset: { theme: "dark" } } };
    runInNewContext(themeBootstrap, {
      document,
      localStorage: { getItem: () => value },
    });
    assert.equal(
      document.documentElement.dataset.theme,
      value === "light" ? "light" : "dark",
    );
  }
  const document = { documentElement: { dataset: { theme: "dark" } } };
  runInNewContext(themeBootstrap, {
    document,
    localStorage: {
      getItem: () => {
        throw Error("blocked");
      },
    },
  });
  assert.equal(document.documentElement.dataset.theme, "dark");
});

function luminance(hex: string) {
  const channels = hex
    .slice(1)
    .match(/../g)
    ?.map((value) => {
      const channel = Number.parseInt(value, 16) / 255;
      return channel <= 0.04045
        ? channel / 12.92
        : ((channel + 0.055) / 1.055) ** 2.4;
    });
  assert.ok(channels?.length === 3);
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}
function contrast(a: string, b: string) {
  const x = luminance(a),
    y = luminance(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}
test("both implemented palettes meet AA normal-text contrast for content, links, errors and buttons", () => {
  const css = readFileSync("app/globals.css", "utf8");
  for (const selector of [":root", ':root[data-theme="light"]']) {
    const start = css.indexOf(`${selector} {`);
    assert.ok(start >= 0);
    const block = css.slice(start, css.indexOf("}", start));
    function color(key: string) {
      let value = block.match(new RegExp(`--${key}: (#[0-9a-fA-F]+);`))?.[1];
      assert.ok(value, key);
      if (value.length === 4)
        value = `#${value
          .slice(1)
          .split("")
          .map((c) => c + c)
          .join("")}`;
      return value;
    }
    for (const text of ["text", "heading", "accent", "muted", "danger"]) {
      for (const bg of ["background", "surface", "surface-hover"]) {
        assert.ok(
          contrast(color(text), color(bg)) >= 4.5,
          `${selector}: ${text} on ${bg}`,
        );
      }
    }
    assert.ok(
      contrast(color("background"), color("accent")) >= 4.5,
      "button text",
    );
  }
  assert.ok(
    contrast("#09203a", "#ffffff") >= 4.5,
    "unchanged white skill panels",
  );
});
