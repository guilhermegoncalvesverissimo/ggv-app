/**
 * Keeps a single emoji from an input's value: the last one typed, so picking
 * a new emoji replaces the old one.
 *
 * Splits by grapheme (what you see as one character) rather than with
 * `.slice(0, 2)`: flags (🇳🇴 is two regional-indicator code points, four
 * UTF-16 units), skin tones and ZWJ sequences (👨‍👩‍👧) are longer than two
 * units, and slicing them left a broken half — a boxed "N" for 🇳🇴.
 */
export function singleEmoji(value: string): string {
  const v = value.trim();
  if (!v) return "";
  if (typeof Intl !== "undefined" && "Segmenter" in Intl) {
    const parts = [...new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(v)];
    return parts[parts.length - 1]?.segment ?? "";
  }
  return Array.from(v).slice(-1).join("");
}
