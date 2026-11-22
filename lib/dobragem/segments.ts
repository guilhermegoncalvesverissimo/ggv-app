import type { Segment } from "./types";

/**
 * Caption tracks and Whisper chunks come in fragments (auto-captions are a
 * few words each). Read aloud one by one they sound choppy and leave no time
 * to catch up, so join them into sentences: break on . ? ! or a pause, and
 * never longer than ~12 s / 240 chars.
 */
export function mergeIntoSentences(parts: Segment[]): Segment[] {
  const out: Segment[] = [];
  let cur: Segment | null = null;
  for (const p of parts) {
    const text = p.en.replace(/\s+/g, " ").replace(/\[[^\]]*\]/g, "").trim();
    if (!text) continue;
    if (
      cur &&
      p.start - cur.end < 1.2 &&
      p.end - cur.start <= 12 &&
      cur.en.length + text.length <= 240 &&
      !/[.?!…]["')\]]?$/.test(cur.en)
    ) {
      cur.en = `${cur.en} ${text}`;
      cur.end = Math.max(cur.end, p.end);
    } else {
      cur = { start: p.start, end: Math.max(p.end, p.start + 0.5), en: text };
      out.push(cur);
    }
  }
  return out;
}

export function youtubeIdFrom(input: string): string | null {
  const s = input.trim();
  const m =
    s.match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/|live\/)|youtu\.be\/)([\w-]{11})/) ??
    s.match(/^([\w-]{11})$/);
  return m ? m[1] : null;
}
