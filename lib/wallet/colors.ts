export const ACCOUNT_COLORS = [
  "#0e0e10", // ink — matches the new monochrome accent (default)
  "#3b82f6", // blue
  "#22c55e", // green
  "#f97316", // orange
  "#ec4899", // pink
  "#06b6d4", // cyan
  "#f59e0b", // amber
  "#14b8a6", // teal
] as const;

export const DEFAULT_ACCOUNT_COLOR = ACCOUNT_COLORS[0];

/** Legacy purple values that used to live in the palette. Re-mapped to the
 *  new default at read time so accounts created before the monochrome flip
 *  don't keep their purple swatch. */
const LEGACY_TO_DEFAULT = new Set(["#7c5cf5", "#8b5cf6", "#a594f9"]);

export function normaliseAccountColor(color: string): string {
  return LEGACY_TO_DEFAULT.has(color.toLowerCase())
    ? DEFAULT_ACCOUNT_COLOR
    : color;
}
