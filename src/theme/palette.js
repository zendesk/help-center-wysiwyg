import {
  DEFAULT_THEME,
  getColor,
  getFocusBoxShadow,
} from "@zendeskgarden/react-components";
import { parseToRgba, toHex } from "color2k";

function resolvePrimaryColor(input) {
  try {
    // Reject transparency rather than compositing against an arbitrary scheme.
    const color = input?.trim();
    if (color && parseToRgba(color)[3] === 1) {
      // CSS "blue" must not mean Garden's built-in "blue" palette.
      return toHex(color);
    }
  } catch {
    // Invalid/unsupported branding must never prevent editor initialization.
  }
  return DEFAULT_THEME.colors.primaryHue;
}

export function resolveScheme(value) {
  return value === "dark" ? "dark" : "light";
}

export function createThemeTokens(input, scheme = "light") {
  const theme = {
    ...DEFAULT_THEME,
    colors: {
      ...DEFAULT_THEME.colors,
      base: resolveScheme(scheme),
      primaryHue: resolvePrimaryColor(input),
    },
  };
  const color = (variable, options) =>
    getColor({ theme, variable, ...options });
  const neutral = (light, dark) =>
    getColor({
      theme,
      hue: "neutralHue",
      light: { shade: light },
      dark: { shade: dark },
    });
  // Source: Garden 10.0.0-next.4 StyledButton / StyledIconButton.
  const buttonTint = (transparency) =>
    getColor({
      theme,
      hue: "neutralHue",
      light: { shade: 700 },
      dark: { hue: "white" },
      transparency,
    });
  const hover = buttonTint(theme.opacity[100]);
  const pressed = buttonTint(theme.opacity[200]);
  const offset100 = { light: { offset: 100 }, dark: { offset: -100 } };
  const offset200 = { light: { offset: 200 }, dark: { offset: -200 } };
  const foreground = color("foreground.default");
  const menuActive = color("background.primaryEmphasis", {
    transparency: theme.opacity[100],
  });

  // Garden owns the palette and states; these are the CKEditor adaptation only.
  // Geometry follows squared (isPill=false), small toggle buttons. Primary
  // buttons are neutral-filled in Flora; branding remains on links/focus/menus.
  return {
    "color-scheme": theme.colors.base,
    "--ck-font-family": theme.fonts.system,
    "--ck-font-size-base": theme.fontSizes.md,
    "--ck-font-size-md": theme.fontSizes.md,
    "--ck-font-weight-medium": theme.fontWeights.semibold,
    "--ck-border-radius-control": theme.borderRadii.md,
    "--ck-border-radius-control-small": theme.borderRadii.md,
    "--ck-border-radius-surface": theme.borderRadii.lg,
    "--ck-border-radius-uniform": theme.borderRadii.lg,
    "--ck-editor-outer-radius": theme.borderRadii.lg,
    "--ck-list-item-button-border-radius": theme.borderRadii.sm,
    "--ck-list-dropdown-button-border-radius": theme.borderRadii.sm,
    "--ck-list-padding": theme.space.xxs,
    "--ck-list-item-outer-padding": `${theme.space.base / 4}px`,
    "--ck-list-item-button-padding": `${theme.space.xs} ${theme.space.sm}`,
    "--ck-size-control-min-height": `${theme.space.base * 8}px`,
    "--ck-icon-size": theme.space.md,
    "--ck-color-base-background": color("background.default"),
    "--ck-color-surface-container": color("background.raised"),
    "--ck-color-base-foreground": color("background.subtle"),
    "--ck-color-base-text": foreground,
    "--ck-color-base-text-light": color("foreground.subtle"),
    // Match Lisbon's deliberate strengthening of essential control boundaries.
    "--ck-color-base-border": color("border.emphasis"),
    "--ck-color-base-border-light": color("border.default"),
    "--ck-color-divider": color("border.default"),
    "--ck-color-base-hover": hover,
    "--ck-color-base-hover-strong": pressed,
    "--ck-button-default-active-background-color": pressed,
    "--ck-color-base-selected": pressed,
    "--ck-color-base-selected-hover": pressed,
    "--ck-color-base-active": neutral(700, 100),
    "--ck-color-base-action": neutral(900, 300),
    "--ck-color-base-action-hover": neutral(800, 200),
    "--ck-button-action-active-background-color": neutral(700, 100),
    "--ck-color-base-action-muted": color("background.subtle"),
    "--ck-color-base-action-disabled": color("background.disabled"),
    "--ck-color-interactive-primary-text": color("foreground.onEmphasis"),
    "--ck-color-interactive-selected-text": color(
      "foreground.subtle",
      offset200,
    ),
    "--ck-color-base-focus": color("border.primaryEmphasis"),
    "--ck-focus-border-color": color("border.primaryEmphasis"),
    "--ck-focus-shadow": getFocusBoxShadow({ theme }),
    "--ck-focus-error-shadow": getFocusBoxShadow({
      theme,
      color: { variable: "border.dangerEmphasis" },
    }),
    "--ck-color-base-error": color("border.dangerEmphasis"),
    "--ck-color-base-success": color("foreground.success"),
    "--ck-color-link-default": color("foreground.primary"),
    "--ck-content-color-mention-background": menuActive,
    "--ck-content-color-mention-text": color("foreground.primary"),
    "--ck-button-save-color": color("foreground.subtle"),
    "--ck-button-cancel-color": foreground,
    "--ck-button-default-disabled-background-color": color(
      "background.disabled",
    ),
    "--ck-button-on-disabled-background-color": color("background.disabled"),
    "--ck-button-action-disabled-background-color": color(
      "background.disabled",
    ),
    "--ck-input-disabled-background-color": color("background.disabled"),
    "--ck-input-disabled-text-color": color("foreground.disabled"),
    "--ck-button-opacity-disabled": 1,
    "--ck-list-button-hover-background-color": menuActive,
    "--ck-list-button-on-background-color": menuActive,
    "--ck-list-button-on-text-color": foreground,
    // Additional local UI tokens: CKEditor has no equivalent for icon foreground
    // states or Garden's menu stripe. They are not a public branding API.
    "--ck-button-default-border-color": "transparent",
    "--ck-button-default-hover-border-color": neutral(600, 500),
    "--ck-button-default-active-border-color": neutral(700, 400),
    "--ck-button-default-text-color": color("foreground.subtle"),
    "--ck-button-default-hover-text-color": color(
      "foreground.subtle",
      offset100,
    ),
    "--ck-button-default-active-text-color": color(
      "foreground.subtle",
      offset200,
    ),
    "--ck-list-item-active-indicator-color": color("border.primaryEmphasis"),
    "--ck-list-item-active-indicator-width": `${theme.space.base}px`,
    "--ck-list-item-check-size": theme.space.md,
    "--ck-list-item-check-inset": theme.space.sm,
    "--ck-list-item-check-padding": `${theme.space.base * 9}px`,
    "--ck-list-item-active-indicator-separator": theme.borders.sm,
    "--ck-focus-outline-width": theme.shadowWidths.sm,
    "--ck-focus-outline-offset": theme.shadowWidths.xs,
  };
}
