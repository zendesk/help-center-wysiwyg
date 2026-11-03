import { parseToRgba } from "color2k";

// Unrounded WCAG contrast for tests, not a runtime color-selection policy.
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
