import { parseToRgba } from "color2k";
import { generateColorScale } from "./generateColorScale";

// Flora 10.0.0-next.4 primary (blue) scale, via Garden's public getColor API.
const DEFAULT_PALETTE = {
  100: "#f3f6fb",
  200: "#e4eaf6",
  300: "#d4ddf0",
  400: "#a3b7df",
  500: "#7f9bd3",
  600: "#698cd3",
  700: "#406cc4",
  800: "#284173",
  900: "#1f335a",
  1000: "#14213b",
  1100: "#0c1322",
  1200: "#080c16",
};

export function resolveBrandPalette(input) {
  try {
    // color2k supports hex, named colors, legacy rgb(a) and hsl(a).
    // Reject transparency rather than silently compositing against the wrong scheme.
    if (!input?.trim() || parseToRgba(input.trim())[3] !== 1) {
      return DEFAULT_PALETTE;
    }
    return generateColorScale(input.trim());
  } catch {
    return DEFAULT_PALETTE;
  }
}

export function resolveScheme(value) {
  return value === "dark" ? "dark" : "light";
}

// Unrounded WCAG contrast, separate from the copied palette algorithm.
export function contrast(a, b) {
  const luminance = (color) => {
    const channels = parseToRgba(color)
      .slice(0, 3)
      .map((channel) => {
        const s = channel / 255;
        return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
      });
    return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
  };
  const values = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (values[0] + 0.05) / (values[1] + 0.05);
}

export function themeTokens(palette, scheme) {
  const dark = scheme === "dark";
  const background = dark ? "#19191a" : "#ffffff";
  const raised = dark ? "#202121" : "#ffffff";
  const subtle = dark ? "#2f3130" : "#f7f7f7";
  const foreground = dark ? "#dcdcda" : "#2f3130";
  const shades = Object.values(palette);
  const primary =
    (dark ? [...shades].reverse() : shades).find(
      (shade) =>
        contrast(shade, background) >= 4.5 && contrast(shade, raised) >= 4.5,
    ) || foreground;
  // Prefer Flora's primary-600/700, strengthening only when contrast requires it.
  const preferred = palette[dark ? 600 : 700];
  const action =
    contrast(preferred, background) >= 4.5 && contrast(preferred, raised) >= 4.5
      ? preferred
      : primary;
  const onAction = contrast(action, "#ffffff") >= 4.5 ? "#ffffff" : "#19191a";
  return {
    "color-scheme": scheme,
    "--ck-color-base-background": background,
    "--ck-color-surface-container": raised,
    "--ck-color-base-foreground": subtle,
    "--ck-color-base-text": foreground,
    "--ck-color-base-text-light": dark ? "#b7b7b3" : "#646864",
    // Essential form boundaries are stronger than Flora's decorative dividers.
    "--ck-color-base-border": dark ? "#8b8e89" : "#8b8e89",
    "--ck-color-base-border-light": dark ? "#404241" : "#dcdcda",
    "--ck-color-divider": dark ? "#404241" : "#dcdcda",
    "--ck-color-base-hover": subtle,
    "--ck-color-base-hover-strong": dark ? "#404241" : "#eae9e8",
    "--ck-color-base-selected": dark ? palette[1000] : palette[100],
    "--ck-color-base-selected-hover": dark ? palette[900] : palette[200],
    "--ck-color-base-active": action,
    "--ck-color-base-action": action,
    "--ck-color-base-action-hover": dark ? palette[400] : palette[800],
    "--ck-color-base-action-muted": dark ? palette[1000] : palette[100],
    "--ck-color-base-action-disabled": dark ? "#404241" : "#dcdcda",
    "--ck-color-interactive-primary-text": onAction,
    "--ck-color-base-focus": action,
    "--ck-focus-border-color": action,
    "--ck-color-base-focus-shadow": `color-mix(in srgb, ${action} 35%, transparent)`,
    "--ck-color-base-error": dark ? "#ff99a2" : "#b32031",
    "--ck-color-base-success": action,
    "--ck-color-link-default": action,
    "--ck-content-color-mention-background": dark
      ? palette[1000]
      : palette[100],
    "--ck-content-color-mention-text": action,
    "--ck-button-save-color": action,
    "--ck-button-cancel-color": foreground,
    "--ck-button-on-disabled-background-color": subtle,
    "--ck-button-action-disabled-background-color": subtle,
    "--ck-input-disabled-background-color": subtle,
    "--ck-input-disabled-text-color": dark ? "#999b97" : "#646864",
  };
}
