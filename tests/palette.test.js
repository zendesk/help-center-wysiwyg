import { describe, expect, it } from "vitest";
import { DEFAULT_THEME, getColor } from "@zendeskgarden/react-components";
import { generateColorScale } from "../src/theme/generateColorScale";
import {
  contrast,
  resolveBrandPalette,
  resolveScheme,
  themeTokens,
} from "../src/theme/palette";

describe("pinned Flora palette", () => {
  it.each([
    "#1f73b7",
    "#ffff00",
    "#ff00ff",
    "#00ff00",
    "black",
    "#fff",
    "hsl(270, 60%, 40%)",
    "rgba(237, 196, 196, 0.5)",
  ])("matches every Garden shade for %s", (color) => {
    const theme = {
      ...DEFAULT_THEME,
      colors: { ...DEFAULT_THEME.colors, primaryHue: color },
    };
    for (const [shade, value] of Object.entries(generateColorScale(color))) {
      expect(value).toBe(
        getColor({ theme, hue: "primaryHue", shade: Number(shade) }),
      );
    }
  });

  it.each([
    undefined,
    "",
    "not-a-color",
    "var(--other)",
    "oklch(60% 0.2 30)",
    "rgba(1, 2, 3, 0.5)",
    "transparent",
  ])("falls back safely for %s", (input) => {
    const palette = resolveBrandPalette(input);
    for (const [shade, value] of Object.entries(palette)) {
      expect(value).toBe(
        getColor({
          theme: DEFAULT_THEME,
          hue: "primaryHue",
          shade: Number(shade),
        }),
      );
    }
  });

  it("only follows the resolved host scheme", () => {
    expect(resolveScheme("dark")).toBe("dark");
    for (const value of [null, "auto", "LIGHT", "light"])
      expect(resolveScheme(value)).toBe("light");
  });

  it.each(["#ffff00", "#ff00ff", "#00ff00", "#000000", "#ffffff", "#1f73b7"])(
    "keeps text/actions/focus/boundaries legible for %s",
    (input) => {
      for (const scheme of ["light", "dark"]) {
        const tokens = themeTokens(resolveBrandPalette(input), scheme);
        const background = tokens["--ck-color-base-background"];
        expect(
          contrast(tokens["--ck-color-base-text"], background),
        ).toBeGreaterThanOrEqual(4.5);
        expect(
          contrast(tokens["--ck-color-base-action"], background),
        ).toBeGreaterThanOrEqual(4.5);
        expect(
          contrast(
            tokens["--ck-color-interactive-primary-text"],
            tokens["--ck-color-base-action"],
          ),
        ).toBeGreaterThanOrEqual(4.5);
        expect(
          contrast(tokens["--ck-focus-border-color"], background),
        ).toBeGreaterThanOrEqual(3);
        expect(
          contrast(tokens["--ck-color-base-border"], background),
        ).toBeGreaterThanOrEqual(3);
      }
    },
  );
});
