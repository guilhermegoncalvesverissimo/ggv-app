/**
 * Period model. A period is one of:
 *  - a specific calendar month  { kind: "month", year, month(0-11) }
 *  - a calendar year            { kind: "year", year }
 *  - all time                   { kind: "all" }
 *
 * The wallet defaults to the current month and the user can step
 * backwards/forwards with arrows.
 */
export type Period =
  | { kind: "month"; year: number; month: number }
  | { kind: "year"; year: number }
  | { kind: "all" };

const MONTHS = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
];

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const pad = (n: number) => String(n).padStart(2, "0");

export function currentMonth(now = new Date()): Period {
  return { kind: "month", year: now.getFullYear(), month: now.getMonth() };
}

/** Short label for the stepper / list header — "Maio 2026", "2026", "Tudo". */
export function periodLabel(p: Period): string {
  if (p.kind === "month") return `${cap(MONTHS[p.month])} ${p.year}`;
  if (p.kind === "year") return `${p.year}`;
  return "Tudo";
}

/** Hero card label — "Saldo de maio 2026", "Saldo de 2026", "Saldo total". */
export function heroLabel(p: Period): string {
  if (p.kind === "month") return `Saldo de ${MONTHS[p.month]} ${p.year}`;
  if (p.kind === "year") return `Saldo de ${p.year}`;
  return "Saldo total";
}

/** Inclusive `[fromIso, toIso]` window, or null for "all". */
export function periodRange(
  p: Period
): { fromIso: string; toIso: string } | null {
  if (p.kind === "all") return null;
  if (p.kind === "year") {
    return { fromIso: `${p.year}-01-01`, toIso: `${p.year}-12-31` };
  }
  const last = new Date(p.year, p.month + 1, 0).getDate();
  const m = pad(p.month + 1);
  return {
    fromIso: `${p.year}-${m}-01`,
    toIso: `${p.year}-${m}-${pad(last)}`,
  };
}

export function isInPeriod(iso: string, p: Period): boolean {
  const r = periodRange(p);
  if (!r) return true;
  return iso >= r.fromIso && iso <= r.toIso;
}

/** Step the period by `delta` units (months for month-mode, years for
 *  year-mode). "all" has nothing to step. */
export function stepPeriod(p: Period, delta: number): Period {
  if (p.kind === "month") {
    const d = new Date(p.year, p.month + delta, 1);
    return { kind: "month", year: d.getFullYear(), month: d.getMonth() };
  }
  if (p.kind === "year") {
    return { kind: "year", year: p.year + delta };
  }
  return p;
}
