// Curated palette — purples + complementary accents that read well against
// the lavender canvas.
const PALETTE = [
  "#7c5cf5",
  "#a594f9",
  "#8b5cf6",
  "#6366f1",
  "#ec4899",
  "#f97316",
  "#22c55e",
  "#06b6d4",
  "#f59e0b",
  "#ef4444",
] as const;

/** Stable hash → palette index. Same name always gets the same color. */
export function colorFor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  }
  return PALETTE[Math.abs(hash) % PALETTE.length];
}

/** "Guilherme Veríssimo" → "GV". Falls back to first letter for single names. */
export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
