import type { Segment } from "./types";

/** Translates the segments in batches through /api/dobragem/traduzir. */
export async function translateSegments(
  segments: Segment[],
  onProgress?: (done: number, total: number) => void
): Promise<Segment[]> {
  const out = segments.map((s) => ({ ...s }));
  const BATCH = 50;
  for (let i = 0; i < out.length; i += BATCH) {
    const slice = out.slice(i, i + BATCH);
    const r = await fetch("/api/dobragem/traduzir", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lines: slice.map((s) => s.en) }),
    });
    const j = (await r.json().catch(() => ({}))) as { lines?: string[]; error?: string };
    if (!r.ok || !j.lines) throw new Error(j.error ?? `Tradução falhou (HTTP ${r.status})`);
    slice.forEach((s, k) => (s.pt = j.lines![k] ?? s.en));
    onProgress?.(Math.min(i + BATCH, out.length), out.length);
  }
  return out;
}
