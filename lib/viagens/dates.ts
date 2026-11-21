/** Datas das viagens são strings YYYY-MM-DD (sem fuso). */

function parse(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function todayStart(): Date {
  const n = new Date();
  return new Date(n.getFullYear(), n.getMonth(), n.getDate());
}

const DAY = 86_400_000;

export function formatDay(iso: string, opts?: { weekday?: boolean }): string {
  return parse(iso).toLocaleDateString("pt-PT", {
    weekday: opts?.weekday ? "short" : undefined,
    day: "numeric",
    month: "short",
  });
}

export function formatRange(start?: string, end?: string): string | null {
  if (!start) return null;
  if (!end || end === start) return formatDay(start);
  const a = parse(start);
  const b = parse(end);
  if (a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth()) {
    const month = b.toLocaleDateString("pt-PT", { month: "short" });
    return `${a.getDate()}–${b.getDate()} ${month}`;
  }
  return `${formatDay(start)} – ${formatDay(end)}`;
}

export function tripLength(start?: string, end?: string): number | null {
  if (!start || !end) return null;
  return Math.round((parse(end).getTime() - parse(start).getTime()) / DAY) + 1;
}

export type TripPhase = "sem-data" | "futura" | "a-decorrer" | "terminada";

export function tripPhase(start?: string, end?: string): TripPhase {
  if (!start) return "sem-data";
  const t = todayStart().getTime();
  const s = parse(start).getTime();
  const e = parse(end ?? start).getTime();
  if (t < s) return "futura";
  if (t > e) return "terminada";
  return "a-decorrer";
}

export function countdownLabel(start?: string, end?: string): string | null {
  const phase = tripPhase(start, end);
  if (phase === "sem-data") return null;
  if (phase === "terminada") return "Terminada";
  if (phase === "a-decorrer") return "A decorrer";
  const days = Math.round((parse(start!).getTime() - todayStart().getTime()) / DAY);
  return days === 1 ? "Amanhã" : `Faltam ${days} dias`;
}

/** Todos os dias entre start e end (inclusive), para agrupar o roteiro. */
export function daysBetween(start?: string, end?: string): string[] {
  if (!start) return [];
  const out: string[] = [];
  const e = parse(end ?? start);
  for (let d = parse(start); d <= e && out.length < 120; d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1)) {
    out.push(
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
    );
  }
  return out;
}
