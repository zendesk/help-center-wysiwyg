import { describe, expect, it } from "vitest";
import {
  DEFAULT_THEME,
  getColor,
  getFocusBoxShadow,
} from "@zendeskgarden/react-components";
import { toHex } from "color2k";
import { createThemeTokens, resolveScheme } from "../src/theme/palette";
import { contrast } from "./contrast";

function gardenTheme(base, primaryHue = DEFAULT_THEME.colors.primaryHue) {
  return {
    ...DEFAULT_THEME,
    colors: { ...DEFAULT_THEME.colors, base, primaryHue },
  };
}

describe("Garden-backed Flora theme", () => {
  it.each([
    "#1f73b7",
    "#ffff00",
    "#ff00ff",
    "#00ff00",
    "black",
    "#fff",
    "blue",
    "red",
    "hsl(270, 60%, 40%)",
    "  rgb(31, 115, 183)  ",
  ])("uses Garden's branded links, focus and menu states for %s", (input) => {
    for (const base of ["light", "dark"]) {
      const tokens = createThemeTokens(input, base);
      const theme = gardenTheme(base, toHex(input.trim()));
      expect(tokens["--ck-color-link-default"]).toBe(
        getColor({ theme, variable: "foreground.primary" }),
      );
      expect(tokens["--ck-focus-shadow"]).toBe(getFocusBoxShadow({ theme }));
      expect(tokens["--ck-list-button-hover-background-color"]).toBe(
        getColor({
          theme,
          variable: "background.primaryEmphasis",
          transparency: theme.opacity[100],
        }),
      );
      expect(tokens["--ck-list-item-active-indicator-color"]).toBe(
        getColor({ theme, variable: "border.primaryEmphasis" }),
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
    "currentColor",
  ])("falls back to Garden's default theme for %s", (input) => {
    for (const base of ["light", "dark"]) {
      const tokens = createThemeTokens(input, base);
      expect(tokens).toEqual(createThemeTokens(undefined, base));
      expect(tokens["--ck-color-link-default"]).toBe(
        getColor({ theme: gardenTheme(base), variable: "foreground.primary" }),
      );
    }
  });

  it.each(["light", "dark"])(
    "maps %s semantic tokens directly from Garden without mutating its theme",
    (base) => {
      const before = JSON.stringify(DEFAULT_THEME);
      const tokens = createThemeTokens(undefined, base);
      const theme = gardenTheme(base);
      expect(tokens["color-scheme"]).toBe(base);
      for (const [key, variable] of Object.entries({
        "--ck-color-base-background": "background.default",
        "--ck-color-surface-container": "background.raised",
        "--ck-color-base-foreground": "background.subtle",
        "--ck-color-base-text": "foreground.default",
        "--ck-color-base-text-light": "foreground.subtle",
        "--ck-color-base-border": "border.emphasis",
        "--ck-color-divider": "border.default",
        "--ck-color-base-error": "border.dangerEmphasis",
        "--ck-color-base-success": "foreground.success",
        "--ck-color-base-action-disabled": "background.disabled",
        "--ck-input-disabled-text-color": "foreground.disabled",
        "--ck-color-interactive-primary-text": "foreground.onEmphasis",
      })) {
        expect(tokens[key]).toBe(getColor({ theme, variable }));
      }
      expect(tokens["--ck-border-radius-control"]).toBe(theme.borderRadii.md);
      expect(tokens["--ck-list-item-button-border-radius"]).toBe(
        theme.borderRadii.sm,
      );
      expect(JSON.stringify(DEFAULT_THEME)).toBe(before);
    },
  );

  it.each(["light", "dark"])(
    "matches Garden's %s neutral button states",
    (base) => {
      const theme = gardenTheme(base);
      const tokens = createThemeTokens(undefined, base);
      for (const [key, transparency] of [
        ["--ck-color-base-hover", theme.opacity[100]],
        ["--ck-button-default-active-background-color", theme.opacity[200]],
        ["--ck-color-base-selected", theme.opacity[200]],
      ]) {
        expect(tokens[key]).toBe(
          getColor({
            theme,
            hue: "neutralHue",
            light: { shade: 700 },
            dark: { hue: "white" },
            transparency,
          }),
        );
      }
      for (const [key, light, dark] of [
        ["--ck-color-base-action", 900, 300],
        ["--ck-color-base-action-hover", 800, 200],
        ["--ck-button-action-active-background-color", 700, 100],
      ]) {
        expect(tokens[key]).toBe(
          getColor({
            theme,
            hue: "neutralHue",
            light: { shade: light },
            dark: { shade: dark },
          }),
        );
      }
    },
  );

  it("only follows the resolved host scheme", () => {
    expect(resolveScheme("dark")).toBe("dark");
    for (const value of [null, "auto", "LIGHT", "light"])
      expect(resolveScheme(value)).toBe("light");
    expect(createThemeTokens("red", "unknown")).toEqual(
      createThemeTokens("red", "light"),
    );
  });

  it.each(["#ffff00", "#ff00ff", "#00ff00", "#000000", "#ffffff", "#1f73b7"])(
    "keeps mapped text/actions/focus/boundaries legible for %s without runtime corrections",
    (input) => {
      for (const base of ["light", "dark"]) {
        const tokens = createThemeTokens(input, base);
        for (const background of [
          tokens["--ck-color-base-background"],
          tokens["--ck-color-surface-container"],
        ]) {
          for (const key of [
            "--ck-color-base-text",
            "--ck-color-link-default",
          ]) {
            expect(contrast(tokens[key], background)).toBeGreaterThanOrEqual(
              4.5,
            );
          }
          for (const key of [
            "--ck-focus-border-color",
            "--ck-color-base-border",
          ]) {
            expect(contrast(tokens[key], background)).toBeGreaterThanOrEqual(3);
          }
        }
        for (const key of [
          "--ck-color-base-action",
          "--ck-color-base-action-hover",
          "--ck-button-action-active-background-color",
        ]) {
          expect(
            contrast(
              tokens["--ck-color-interactive-primary-text"],
              tokens[key],
            ),
          ).toBeGreaterThanOrEqual(4.5);
        }
      }
    },
  );
});
