import type { WalletEvent } from "./types";

export type EventInput = Omit<WalletEvent, "id" | "createdAt">;

type Row = {
  id: string;
  name: string;
  emoji: string | null;
  color: string;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
};

export function toWalletEvent(r: Row): WalletEvent {
  return {
    id: r.id,
    name: r.name,
    emoji: r.emoji ?? undefined,
    color: r.color,
    startDate: r.start_date ?? undefined,
    endDate: r.end_date ?? undefined,
    createdAt: new Date(r.created_at).getTime(),
  };
}

const ISO = /^\d{4}-\d{2}-\d{2}$/;

/** Maps the fields present in `body` to columns (server side). */
export function eventColumns(body: Partial<EventInput>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  const text = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null);
  if ("name" in body) out.name = text(body.name);
  if ("emoji" in body) out.emoji = text(body.emoji);
  if (typeof body.color === "string" && body.color) out.color = body.color;
  if ("startDate" in body) out.start_date = typeof body.startDate === "string" && ISO.test(body.startDate) ? body.startDate : null;
  if ("endDate" in body) out.end_date = typeof body.endDate === "string" && ISO.test(body.endDate) ? body.endDate : null;
  return out;
}
