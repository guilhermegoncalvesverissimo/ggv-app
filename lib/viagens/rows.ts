import type { ChecklistItem, Trip, TripInput, TripItem, TripPhoto } from "@/lib/viagens/types";

export type Row = {
  id: string;
  name: string;
  destination: string | null;
  emoji: string | null;
  color: string;
  start_date: string | null;
  end_date: string | null;
  budget_cents: number | null;
  notes: string | null;
  items: TripItem[] | null;
  checklist: ChecklistItem[] | null;
  photos?: TripPhoto[] | null;
  created_at: string;
  updated_at: string;
};

export function toTrip(r: Row): Trip {
  return {
    id: r.id,
    name: r.name,
    destination: r.destination ?? undefined,
    emoji: r.emoji ?? undefined,
    color: r.color,
    startDate: r.start_date ?? undefined,
    endDate: r.end_date ?? undefined,
    budgetCents: r.budget_cents == null ? undefined : Number(r.budget_cents),
    notes: r.notes ?? undefined,
    items: Array.isArray(r.items) ? r.items : [],
    checklist: Array.isArray(r.checklist) ? r.checklist : [],
    photos: Array.isArray(r.photos) ? r.photos : [],
    createdAt: new Date(r.created_at).getTime(),
    updatedAt: new Date(r.updated_at).getTime(),
  };
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const date = (v: unknown) => (typeof v === "string" && ISO_DATE.test(v) ? v : null);
const text = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null);

/** Maps the fields present in `body` to columns. Unknown keys are ignored. */
export function toColumns(body: Partial<TripInput>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if ("name" in body) out.name = text(body.name);
  if ("destination" in body) out.destination = text(body.destination);
  if ("emoji" in body) out.emoji = text(body.emoji);
  if ("color" in body && typeof body.color === "string" && body.color) out.color = body.color;
  if ("startDate" in body) out.start_date = date(body.startDate);
  if ("endDate" in body) out.end_date = date(body.endDate);
  if ("budgetCents" in body)
    out.budget_cents =
      typeof body.budgetCents === "number" && Number.isFinite(body.budgetCents)
        ? Math.round(body.budgetCents)
        : null;
  if ("notes" in body) out.notes = text(body.notes);
  if ("items" in body) out.items = Array.isArray(body.items) ? body.items : [];
  if ("checklist" in body) out.checklist = Array.isArray(body.checklist) ? body.checklist : [];
  return out;
}

export const tableMissing = (msg?: string) =>
  !!msg && /could not find the table|does not exist/i.test(msg);
