import { expect, it } from "vitest";
import { DEFAULT_THEME, getColor } from "@zendeskgarden/react-components";
import {
  createGardenTheme,
  getEditorVariables,
  resolveScheme,
} from "../src/theme/adapter";

it("passes trimmed settings to Garden without changing palette-name semantics", () => {
  expect(createGardenTheme("  blue  ").colors.primaryHue).toBe("blue");
  expect(createGardenTheme(" #1f73b7 ").colors.primaryHue).toBe("#1f73b7");
});

it.each(["light", "dark"])(
  "uses neutral accents for missing, empty or invalid branding in %s mode",
  (scheme) => {
    const neutralVariables = getEditorVariables(
      createGardenTheme(DEFAULT_THEME.colors.neutralHue, scheme),
    );
    for (const primary of [undefined, null, "", "  ", "not-a-color"]) {
      const theme = createGardenTheme(primary, scheme);
      expect(theme.colors.primaryHue).toBe(DEFAULT_THEME.colors.neutralHue);
      expect(getEditorVariables(theme)["--ck-focus-shadow"]).toBe(
        neutralVariables["--ck-focus-shadow"],
      );
    }
  },
);

it.each(["light", "dark"])(
  "purely maps an existing %s Garden theme",
  (scheme) => {
    const theme = createGardenTheme("blue", scheme);
    const before = JSON.stringify(theme);
    Object.freeze(theme.colors);
    Object.freeze(theme);
    const variables = getEditorVariables(theme);
    expect(variables["--ck-color-link-default"]).toBe(
      getColor({ theme, variable: "foreground.primary" }),
    );
    expect(variables["--ck-color-base-background"]).toBe(
      getColor({ theme, variable: "background.default" }),
    );
    expect(variables["--ck-color-base-border"]).toBe(
      getColor({
        theme,
        variable: "border.default",
        light: { offset: 300 },
        dark: { offset: -100 },
      }),
    );
    expect(variables["--ck-font-family"]).toBe(theme.fonts.system);
    expect(variables["--ck-border-radius-control"]).toBe(theme.borderRadii.md);
    expect(variables["--ck-color-base-hover"]).toContain("rgba(");
    expect(JSON.stringify(theme)).toBe(before);
  },
);

it("only follows the resolved host scheme, defaulting unknown values to light", () => {
  expect(resolveScheme("dark")).toBe("dark");
  for (const value of [null, "auto", "LIGHT", "light"])
    expect(resolveScheme(value)).toBe("light");
});
