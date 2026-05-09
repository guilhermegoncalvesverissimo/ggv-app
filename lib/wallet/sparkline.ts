import type { Transaction } from "./types";

export type SparklinePoint = { iso: string; value: number };

/**
 * Daily cumulative balance for a list of transactions, starting at 0.
 *
 * Buckets transactions by ISO date and emits one point per day with the
 * running net. Returns empty array when there are no transactions.
 */
export function dailyCumulative(
  transactions: Transaction[]
): SparklinePoint[] {
  if (transactions.length === 0) return [];

  // Sum per day.
  const byDay = new Map<string, number>();
  let minIso = transactions[0].date;
  let maxIso = transactions[0].date;
  for (const t of transactions) {
    const signed = t.type === "income" ? t.amountCents : -t.amountCents;
    byDay.set(t.date, (byDay.get(t.date) ?? 0) + signed);
    if (t.date < minIso) minIso = t.date;
    if (t.date > maxIso) maxIso = t.date;
  }

  // Build a continuous series from min to max so flat days still show.
  const points: SparklinePoint[] = [];
  let running = 0;
  let cursor = minIso;
  let safety = 0;
  while (cursor <= maxIso && safety++ < 5000) {
    running += byDay.get(cursor) ?? 0;
    points.push({ iso: cursor, value: running });
    cursor = nextIso(cursor);
  }
  return points;
}

/**
 * Build an SVG path-data string for a polyline through the given points,
 * normalised to the given viewBox dimensions with `padding` inset.
 *
 * Returns `{ line, area }` where:
 *  - `line` is a `M ... L ...` path you can stroke
 *  - `area` is the same path closed back along the bottom for fill
 */
export function buildSparkPath(
  points: SparklinePoint[],
  width: number,
  height: number,
  padding = 2
): { line: string; area: string } | null {
  if (points.length === 0) return null;
  if (points.length === 1) {
    // Render as a flat line through the middle.
    const y = height / 2;
    return {
      line: `M ${padding} ${y} L ${width - padding} ${y}`,
      area: `M ${padding} ${y} L ${width - padding} ${y} L ${
        width - padding
      } ${height} L ${padding} ${height} Z`,
    };
  }

  let min = points[0].value;
  let max = points[0].value;
  for (const p of points) {
    if (p.value < min) min = p.value;
    if (p.value > max) max = p.value;
  }
  // Avoid divide-by-zero when all points are equal.
  const span = max - min || 1;

  const innerW = width - padding * 2;
  const innerH = height - padding * 2;

  const coords = points.map((p, i) => {
    const x = padding + (i / (points.length - 1)) * innerW;
    // Invert Y so larger values are higher on screen.
    const y = padding + innerH - ((p.value - min) / span) * innerH;
    return { x, y };
  });

  const line = coords
    .map((c, i) => `${i === 0 ? "M" : "L"} ${c.x.toFixed(2)} ${c.y.toFixed(2)}`)
    .join(" ");

  const last = coords[coords.length - 1];
  const first = coords[0];
  const area = `${line} L ${last.x.toFixed(2)} ${height} L ${first.x.toFixed(
    2
  )} ${height} Z`;

  return { line, area };
}

function nextIso(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + 1);
  const ny = date.getFullYear();
  const nm = String(date.getMonth() + 1).padStart(2, "0");
  const nd = String(date.getDate()).padStart(2, "0");
  return `${ny}-${nm}-${nd}`;
}
