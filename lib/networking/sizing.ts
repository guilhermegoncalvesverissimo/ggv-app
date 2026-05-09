/**
 * Bubble diameter (px) given encounter count.
 *
 * Uses a sqrt scale so the first few encounters give visible growth without
 * letting heavy connections dwarf everyone else.
 */
export function bubbleSize(encounters: number): number {
  const MIN = 64;
  const MAX = 144;
  // Saturates around 25 encounters.
  const t = Math.min(1, Math.sqrt(encounters) / 5);
  return Math.round(MIN + (MAX - MIN) * t);
}

export function encountersInLastDays(
  encounters: { at: number }[],
  days: number,
  now: number = Date.now()
): number {
  const cutoff = now - days * 86_400_000;
  return encounters.reduce((acc, e) => (e.at >= cutoff ? acc + 1 : acc), 0);
}
