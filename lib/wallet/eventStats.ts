import type { Transaction } from "./types";

/** What an event cost: spent, got back (friends paying their share,
 *  refunds) and the net. */
export function eventTotals(txs: Transaction[]) {
  let spent = 0;
  let received = 0;
  for (const t of txs) {
    if (t.type === "expense") spent += t.amountCents;
    else received += t.amountCents;
  }
  return { spent, received, net: spent - received, count: txs.length };
}

export function eventRange(start?: string, end?: string): string | null {
  if (!start) return null;
  const f = (iso: string) => {
    const [y, m, d] = iso.split("-").map(Number);
    return new Date(y, m - 1, d).toLocaleDateString("pt-PT", { day: "numeric", month: "short" });
  };
  return !end || end === start ? f(start) : `${f(start)} – ${f(end)}`;
}
