const eur = new Intl.NumberFormat("pt-PT", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const eurNoCents = new Intl.NumberFormat("pt-PT", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

/** 12345 → "€123,45". Pass `signed: true` to prefix +/−. */
export function formatCents(
  cents: number,
  opts: { signed?: boolean; noCents?: boolean } = {}
): string {
  const abs = Math.abs(cents) / 100;
  const f = opts.noCents ? eurNoCents : eur;
  const formatted = f.format(abs);
  if (!opts.signed) return formatted;
  if (cents > 0) return `+${formatted}`;
  if (cents < 0) return `−${formatted}`;
  return formatted;
}

/** "12,34" or "12.34" → 1234 (cents). Returns NaN on invalid. */
export function parseAmountToCents(input: string): number {
  if (!input) return NaN;
  const cleaned = input.replace(/\s/g, "").replace(",", ".");
  const n = Number(cleaned);
  if (!Number.isFinite(n) || n < 0) return NaN;
  return Math.round(n * 100);
}

/** ISO date `YYYY-MM-DD` for today, in local time. */
export function todayIso(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const dateFmt = new Intl.DateTimeFormat("pt-PT", {
  day: "numeric",
  month: "short",
});

export function formatDateRelative(iso: string, now = new Date()): string {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffDays = Math.round((today.getTime() - date.getTime()) / 86_400_000);
  if (diffDays === 0) return "Hoje";
  if (diffDays === 1) return "Ontem";
  if (diffDays < 7) return `Há ${diffDays} dias`;
  return dateFmt.format(date);
}

export function isInMonth(iso: string, year: number, month: number): boolean {
  const [y, m] = iso.split("-").map(Number);
  return y === year && m === month + 1;
}
