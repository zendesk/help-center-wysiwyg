// Copied from lisbon-theme src/color-scheme/generateColorScale.ts
// commit 02d04e3bbd0362890225c4c278831a2356600ad0.
// Reference: @zendeskgarden/react-components@10.0.0-next.4.
// Keep input validation outside this Garden-compatible algorithm.
import { getScale, toHex, parseToRgba } from "color2k";
function getLuminance(color) {
  const [r, g, b] = parseToRgba(color).map((c, i) => {
    if (i === 3) return c;
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return parseFloat((0.2126 * r + 0.7152 * g + 0.0722 * b).toFixed(3));
}
function getContrast(color1, color2) {
  const l1 = getLuminance(color1);
  const l2 = getLuminance(color2);
  return parseFloat(
    (l1 > l2 ? (l1 + 0.05) / (l2 + 0.05) : (l2 + 0.05) / (l1 + 0.05)).toFixed(
      2,
    ),
  );
}
const OFFSET_TO_TARGET_RATIO = {
  100: 1.08,
  200: 1.2,
  300: 1.35,
  400: 2,
  500: 2.8,
  600: 3.3,
  700: 5,
  800: 10,
  900: 13,
  1e3: 16,
  1100: 17.5,
  1200: 19,
};
function findNearestIndex(target, arr, startIndex = 0) {
  let left = startIndex;
  let right = arr.length - 1;
  if (target < arr[left]) return left;
  if (target > arr[right]) return right;
  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    if (arr[mid] === target) {
      return mid;
    } else if (arr[mid] < target) {
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }
  return arr[left] - target < target - arr[right] ? left : right;
}
export function generateColorScale(color) {
  const scaleSize = 200;
  const _scale = getScale("#FFF", color, "#000");
  const scale = (x) => _scale(x / scaleSize);
  const colors = [];
  const contrastRatios = [];
  for (let i = 0; i <= scaleSize; i++) {
    const c = toHex(scale(i));
    colors.push(c);
    contrastRatios.push(getContrast("#FFF", c));
  }
  const palette = {};
  let startIndex = 0;
  for (const offset in OFFSET_TO_TARGET_RATIO) {
    if (Object.prototype.hasOwnProperty.call(OFFSET_TO_TARGET_RATIO, offset)) {
      const ratio = OFFSET_TO_TARGET_RATIO[offset];
      const nearestIndex = findNearestIndex(ratio, contrastRatios, startIndex);
      startIndex = nearestIndex + 1;
      palette[offset] = colors[nearestIndex];
    }
  }
  return palette;
}
