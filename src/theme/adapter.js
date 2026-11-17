import {
  DEFAULT_THEME,
  getColor,
  getFocusBoxShadow,
} from "@zendeskgarden/react-components";

export function resolveScheme(value) {
  return value === "dark" ? "dark" : "light";
}

export function createGardenTheme(primaryColor, scheme = "light") {
  const theme = {
    ...DEFAULT_THEME,
    colors: {
      ...DEFAULT_THEME.colors,
      base: resolveScheme(scheme),
      primaryHue: primaryColor?.trim() || DEFAULT_THEME.colors.neutralHue,
    },
  };
  try {
    // Garden throws for unsupported brand colors. Fall back rather than failing
    // editor creation because of a theme setting.
    getColor({ theme, variable: "foreground.primary" });
  } catch {
    theme.colors.primaryHue = DEFAULT_THEME.colors.neutralHue;
  }
  return theme;
}

export function getEditorVariables(theme) {
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
  const tooltipBackground = neutral(900, 700);
  const menuActive = color("background.primaryEmphasis", {
    transparency: theme.opacity[100],
  });

  // Garden owns the palette and states; these are the CKEditor adaptation only.
  // Geometry follows squared (isPill=false), small toggle buttons. Primary
  // buttons are neutral-filled in Flora; branding remains on links/focus/menus.
  return {
    "--ck-font-family": theme.fonts.system,
    "--ck-font-size-xs": theme.fontSizes.xs,
    "--ck-font-size-sm": theme.fontSizes.sm,
    "--ck-font-size-md": theme.fontSizes.md,
    "--ck-font-size-lg": theme.fontSizes.lg,
    "--ck-font-size-xl": theme.fontSizes.xl,
    // Apply Garden styles for tooltips.
    "--ck-tooltip-text-font-size": theme.fontSizes.sm,
    "--ck-tooltip-padding": `0 ${theme.space.sm}`,
    "--ck-tooltip-multiline-padding": "0",
    "--ck-tooltip-border-radius": theme.borderRadii.sm,
    "--ck-tooltip-border": `${theme.borders.sm} ${tooltipBackground}`,
    "--ck-tooltip-background-color": tooltipBackground,
    "--ck-tooltip-text-color": getColor({ theme, hue: "white" }),
    "--ck-editor-editable-padding": `${theme.space.base * 2.5}px ${theme.space.sm}`,
    // Apply Flora toolbar spacing and control sizes.
    "--hc-wysiwyg-toolbar-padding": `${theme.space.base / 2}px ${theme.space.xs}`,
    "--hc-wysiwyg-toolbar-item-margin": `${theme.space.base * 1.5}px`,
    "--hc-wysiwyg-toolbar-gap": `${theme.space.base / 2}px`,
    "--hc-wysiwyg-toolbar-separator-margin": `${theme.space.base * 1.5}px`,
    "--hc-wysiwyg-toolbar-icon-size": theme.space.md,
    "--hc-wysiwyg-toolbar-control-height": `${theme.space.base * 8}px`,
    "--hc-wysiwyg-toolbar-separator-color": color("border.subtle"),
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
    // Match Copenhagen and Lisbon form-control border contrast in both schemes.
    "--ck-color-base-border": color("border.default", {
      light: { offset: 300 },
      dark: { offset: -100 },
    }),
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
    // Local tokens consumed by src/styles.css, not CKEditor variables.
    "--hc-wysiwyg-tooltip-line-height": `${theme.space.base * 5}px`,
    "--hc-wysiwyg-tooltip-shadow": theme.shadows.lg(
      `${theme.space.base}px`,
      `${theme.space.base * 2}px`,
      color("shadow.small"),
    ),
    "--hc-wysiwyg-button-default-border-color": "transparent",
    "--hc-wysiwyg-button-default-hover-border-color": neutral(600, 500),
    "--hc-wysiwyg-button-default-active-border-color": neutral(700, 400),
    "--hc-wysiwyg-button-default-text-color": color("foreground.subtle"),
    "--hc-wysiwyg-button-default-hover-text-color": color(
      "foreground.subtle",
      offset100,
    ),
    "--hc-wysiwyg-button-default-active-text-color": color(
      "foreground.subtle",
      offset200,
    ),
    "--hc-wysiwyg-list-item-active-indicator-color": color(
      "border.primaryEmphasis",
    ),
    "--hc-wysiwyg-list-item-active-indicator-width": `${theme.space.base}px`,
    "--hc-wysiwyg-list-item-check-size": theme.space.md,
    "--hc-wysiwyg-list-item-check-inset": theme.space.sm,
    "--hc-wysiwyg-list-item-check-padding": `${theme.space.base * 9}px`,
    "--hc-wysiwyg-list-item-active-indicator-separator": theme.borders.sm,
    "--hc-wysiwyg-focus-outline-width": theme.shadowWidths.sm,
    "--hc-wysiwyg-focus-outline-offset": theme.shadowWidths.xs,
  };
}
