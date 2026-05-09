export type Period = "thisMonth" | "lastMonth" | "year" | "all";

export const PERIOD_LABELS: Record<Period, string> = {
  thisMonth: "Este mês",
  lastMonth: "Mês anterior",
  year: "Este ano",
  all: "Tudo",
};

export const HERO_LABELS: Record<Period, string> = {
  thisMonth: "Saldo deste mês",
  lastMonth: "Saldo do mês anterior",
  year: "Saldo deste ano",
  all: "Saldo total",
};

/** Returns inclusive `[fromIso, toIso]` window for the given period, or null for "all". */
export function periodRange(
  period: Period,
  now = new Date()
): { fromIso: string; toIso: string } | null {
  const y = now.getFullYear();
  const m = now.getMonth();
  switch (period) {
    case "thisMonth":
      return { fromIso: iso(y, m, 1), toIso: iso(y, m, lastDay(y, m)) };
    case "lastMonth": {
      const prevYear = m === 0 ? y - 1 : y;
      const prevMonth = m === 0 ? 11 : m - 1;
      return {
        fromIso: iso(prevYear, prevMonth, 1),
        toIso: iso(prevYear, prevMonth, lastDay(prevYear, prevMonth)),
      };
    }
    case "year":
      return { fromIso: iso(y, 0, 1), toIso: iso(y, 11, 31) };
    case "all":
      return null;
  }
}

export function isInPeriod(
  iso: string,
  period: Period,
  now = new Date()
): boolean {
  const range = periodRange(period, now);
  if (!range) return true;
  return iso >= range.fromIso && iso <= range.toIso;
}

function iso(y: number, m: number, d: number): string {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function lastDay(y: number, m: number): number {
  return new Date(y, m + 1, 0).getDate();
}
