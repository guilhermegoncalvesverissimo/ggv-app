"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  Check,
  ChevronLeft,
  Clock,
  ExternalLink,
  MapPin,
  Pencil,
  Plus,
  X,
} from "lucide-react";
import { useTrips } from "@/lib/viagens/useTrips";
import {
  countdownLabel,
  daysBetween,
  formatDay,
  formatRange,
  tripLength,
} from "@/lib/viagens/dates";
import { formatCents } from "@/lib/wallet/format";
import {
  KIND_META,
  localId,
  type ChecklistItem,
  type Trip,
  type TripInput,
  type TripItem,
} from "@/lib/viagens/types";
import { cn } from "@/lib/utils";
import { TripFormSheet } from "./TripFormSheet";
import { ItemSheet, type ItemValues } from "./ItemSheet";

type Tab = "roteiro" | "checklist" | "notas";

const TABS: { id: Tab; label: string }[] = [
  { id: "roteiro", label: "Roteiro" },
  { id: "checklist", label: "Checklist" },
  { id: "notas", label: "Notas" },
];

export function TripDetail({ id }: { id: string }) {
  const router = useRouter();
  const { trips, hydrated, updateTrip, removeTrip } = useTrips();
  const trip = trips.find((t) => t.id === id) ?? null;

  if (!hydrated) {
    return (
      <div className="card flex items-center justify-center p-10 text-sm text-muted">
        A carregar…
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="space-y-4 pt-1">
        <BackLink />
        <div className="card p-6 text-center text-sm text-muted">
          Esta viagem já não existe.
        </div>
      </div>
    );
  }

  return (
    <TripView
      trip={trip}
      onPatch={(patch) => updateTrip(trip.id, patch)}
      onDelete={() => {
        removeTrip(trip.id);
        router.replace("/viagens");
      }}
    />
  );
}

function BackLink() {
  return (
    <Link
      href="/viagens"
      className="inline-flex items-center gap-1 text-sm font-medium text-muted transition hover:text-ink"
    >
      <ChevronLeft className="h-4 w-4" /> Viagens
    </Link>
  );
}

function TripView({
  trip,
  onPatch,
  onDelete,
}: {
  trip: Trip;
  onPatch: (patch: Partial<TripInput>) => void;
  onDelete: () => void;
}) {
  const [tab, setTab] = useState<Tab>("roteiro");
  const [editOpen, setEditOpen] = useState(false);

  const range = formatRange(trip.startDate, trip.endDate);
  const nights = tripLength(trip.startDate, trip.endDate);
  const countdown = countdownLabel(trip.startDate, trip.endDate);
  const spent = trip.items.reduce((s, i) => s + (i.costCents ?? 0), 0);

  return (
    <div className="space-y-4 pt-1">
      <BackLink />

      <section className="card overflow-hidden">
        <div
          className="flex items-start gap-3 p-5 text-white"
          style={{ background: `linear-gradient(150deg, ${trip.color}, ${trip.color}bb)` }}
        >
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/20 text-2xl backdrop-blur">
            {trip.emoji ?? trip.name[0]?.toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-semibold leading-tight tracking-tight">
              {trip.name}
            </h1>
            <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-sm text-white/85">
              {trip.destination && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" /> {trip.destination}
                </span>
              )}
              {range && (
                <span className="flex items-center gap-1">
                  <CalendarDays className="h-3.5 w-3.5" /> {range}
                  {nights && nights > 1 ? ` · ${nights} dias` : ""}
                </span>
              )}
            </div>
            {countdown && (
              <span className="mt-2 inline-block rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-medium">
                {countdown}
              </span>
            )}
          </div>
          <button
            type="button"
            aria-label="Editar viagem"
            onClick={() => setEditOpen(true)}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/20 transition active:scale-95"
          >
            <Pencil className="h-4 w-4" />
          </button>
        </div>

        {(spent > 0 || trip.budgetCents) && (
          <BudgetBar spent={spent} budget={trip.budgetCents} />
        )}
      </section>

      <div className="flex gap-1 rounded-full bg-canvas-soft/60 p-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              "flex-1 rounded-full px-3 py-2 text-sm font-medium transition",
              tab === t.id ? "bg-elevated text-white" : "text-muted"
            )}
          >
            {t.label}
            {t.id === "checklist" && trip.checklist.length > 0 && (
              <span className="ml-1 text-xs opacity-70">
                {trip.checklist.filter((c) => c.done).length}/{trip.checklist.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {tab === "roteiro" && (
        <Itinerary trip={trip} onChange={(items) => onPatch({ items })} />
      )}
      {tab === "checklist" && (
        <Checklist items={trip.checklist} onChange={(checklist) => onPatch({ checklist })} />
      )}
      {tab === "notas" && (
        <Notes
          key={trip.id}
          value={trip.notes ?? ""}
          onSave={(notes) => onPatch({ notes: notes || undefined })}
        />
      )}

      <TripFormSheet
        open={editOpen}
        onClose={() => setEditOpen(false)}
        trip={trip}
        onSubmit={(v) => onPatch(v)}
        onDelete={onDelete}
      />
    </div>
  );
}

function BudgetBar({ spent, budget }: { spent: number; budget?: number }) {
  const pct = budget ? Math.min(100, (spent / budget) * 100) : 0;
  const over = !!budget && spent > budget;
  return (
    <div className="space-y-2 p-5 pt-4">
      <div className="flex items-baseline justify-between text-sm">
        <span className="text-muted">Previsto</span>
        <span className="font-semibold tabular-nums">
          {formatCents(spent)}
          {budget ? (
            <span className="font-normal text-muted"> / {formatCents(budget)}</span>
          ) : null}
        </span>
      </div>
      {budget ? (
        <div className="h-2 overflow-hidden rounded-full bg-canvas-soft">
          <div
            className={cn("h-full rounded-full", over ? "bg-danger" : "bg-success")}
            style={{ width: `${pct}%` }}
          />
        </div>
      ) : null}
      {over && (
        <p className="text-xs text-danger">
          Passa o orçamento em {formatCents(spent - budget!)}.
        </p>
      )}
    </div>
  );
}

/* ------------------------------- Roteiro -------------------------------- */

function sortItems(a: TripItem, b: TripItem) {
  return (a.time ?? "99:99").localeCompare(b.time ?? "99:99");
}

function Itinerary({
  trip,
  onChange,
}: {
  trip: Trip;
  onChange: (items: TripItem[]) => void;
}) {
  const [sheet, setSheet] = useState<{ item?: TripItem; date?: string } | null>(null);

  const days = useMemo(() => {
    // Every day of the trip shows up (even empty ones, so you can tap "+"),
    // plus any day an item was put on outside the trip's dates.
    const set = new Set(daysBetween(trip.startDate, trip.endDate));
    for (const i of trip.items) if (i.date) set.add(i.date);
    return [...set].sort();
  }, [trip.startDate, trip.endDate, trip.items]);

  const byDay = useMemo(() => {
    const m = new Map<string, TripItem[]>();
    for (const i of trip.items) {
      const k = i.date ?? "";
      m.set(k, [...(m.get(k) ?? []), i]);
    }
    for (const list of m.values()) list.sort(sortItems);
    return m;
  }, [trip.items]);

  const undated = byDay.get("") ?? [];
  const tripDays = daysBetween(trip.startDate, trip.endDate);

  const save = (values: ItemValues) => {
    if (sheet?.item) {
      const id = sheet.item.id;
      onChange(trip.items.map((i) => (i.id === id ? { ...values, id } : i)));
    } else {
      onChange([...trip.items, { ...values, id: localId() }]);
    }
  };

  return (
    <>
      {days.length === 0 && undated.length === 0 && (
        <div className="card p-6 text-center text-sm text-muted">
          Ainda não há nada no roteiro. Junta voos, alojamento, sítios a visitar e
          restaurantes com o botão +.
        </div>
      )}

      {days.map((d) => {
        const list = byDay.get(d) ?? [];
        const dayNum = tripDays.indexOf(d);
        return (
          <section key={d} className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-sm font-semibold capitalize text-ink">
                {dayNum >= 0 && (
                  <span className="mr-1.5 text-muted">Dia {dayNum + 1} ·</span>
                )}
                {formatDay(d, { weekday: true })}
              </h3>
              <button
                type="button"
                aria-label={`Adicionar a ${formatDay(d)}`}
                onClick={() => setSheet({ date: d })}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-canvas-soft/60 text-muted transition active:scale-95"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            {list.length === 0 ? (
              <button
                type="button"
                onClick={() => setSheet({ date: d })}
                className="w-full rounded-3xl border border-dashed border-card-border px-4 py-3 text-left text-sm text-muted"
              >
                Dia livre — toca para planear
              </button>
            ) : (
              list.map((i) => (
                <ItemRow key={i.id} item={i} onTap={() => setSheet({ item: i })} />
              ))
            )}
          </section>
        );
      })}

      {undated.length > 0 && (
        <section className="space-y-2">
          <h3 className="px-1 text-sm font-semibold text-muted">Por agendar</h3>
          {undated.map((i) => (
            <ItemRow key={i.id} item={i} onTap={() => setSheet({ item: i })} />
          ))}
        </section>
      )}

      <button
        type="button"
        aria-label="Adicionar ao roteiro"
        onClick={() => setSheet({})}
        className="fixed bottom-[calc(var(--nav-bottom)+5.5rem)] right-5 z-20 flex h-14 w-14 items-center justify-center rounded-full bg-elevated text-white shadow-[0_18px_40px_-12px_rgba(15,12,41,0.55)] transition active:scale-95"
      >
        <Plus className="h-6 w-6" strokeWidth={2.5} />
      </button>

      <ItemSheet
        open={!!sheet}
        onClose={() => setSheet(null)}
        item={sheet?.item ?? null}
        defaultDate={sheet?.date ?? trip.startDate}
        onSubmit={save}
        onDelete={
          sheet?.item
            ? () => {
                const id = sheet.item!.id;
                onChange(trip.items.filter((i) => i.id !== id));
              }
            : undefined
        }
      />
    </>
  );
}

function ItemRow({ item, onTap }: { item: TripItem; onTap: () => void }) {
  const meta = KIND_META[item.kind] ?? KIND_META.outro;
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onTap}
      onKeyDown={(e) => e.key === "Enter" && onTap()}
      className="card flex w-full cursor-pointer items-start gap-3 p-4 text-left transition active:scale-[0.99]"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-canvas-soft/60 text-lg">
        {meta.emoji}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <p className="truncate font-medium text-ink">{item.title}</p>
          {item.costCents != null && item.costCents > 0 && (
            <span className="shrink-0 text-sm tabular-nums text-muted">
              {formatCents(item.costCents)}
            </span>
          )}
        </div>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted">
          {item.time && (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" /> {item.time}
            </span>
          )}
          {item.place && (
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.place)}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex min-w-0 items-center gap-1 underline-offset-2 hover:underline"
            >
              <MapPin className="h-3 w-3 shrink-0" />
              <span className="truncate">{item.place}</span>
            </a>
          )}
          {item.link && (
            <a
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1 font-medium text-accent"
            >
              <ExternalLink className="h-3 w-3" /> Abrir
            </a>
          )}
        </div>
        {item.notes && (
          <p className="mt-1 line-clamp-2 whitespace-pre-line text-xs text-muted">
            {item.notes}
          </p>
        )}
      </div>
    </div>
  );
}

/* ------------------------------ Checklist ------------------------------- */

const SUGGESTIONS = [
  "Passaporte / CC",
  "Carregador",
  "Adaptador de tomada",
  "Seguro de viagem",
  "Check-in online",
  "Roupa interior",
  "Escova de dentes",
  "Medicação",
];

function Checklist({
  items,
  onChange,
}: {
  items: ChecklistItem[];
  onChange: (items: ChecklistItem[]) => void;
}) {
  const [text, setText] = useState("");
  const existing = new Set(items.map((i) => i.text.toLowerCase()));
  const suggestions = SUGGESTIONS.filter((s) => !existing.has(s.toLowerCase()));

  const add = (value: string) => {
    const t = value.trim();
    if (!t) return;
    onChange([...items, { id: localId("c"), text: t, done: false }]);
  };

  // Pending first, done at the bottom; otherwise insertion order.
  const ordered = [...items].sort((a, b) => Number(a.done) - Number(b.done));

  return (
    <section className="card space-y-3 p-4">
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          add(text);
          setText("");
        }}
      >
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Adicionar à mala ou tarefa…"
          className="min-w-0 flex-1 rounded-full bg-canvas-soft/40 px-4 py-2.5 text-base text-ink outline-none ring-2 ring-transparent transition focus:bg-card-bg focus:ring-accent"
        />
        <button
          type="submit"
          aria-label="Adicionar"
          disabled={!text.trim()}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-elevated text-white transition active:scale-95 disabled:opacity-40"
        >
          <Plus className="h-5 w-5" />
        </button>
      </form>

      {ordered.length > 0 && (
        <ul className="divide-y divide-card-border">
          {ordered.map((c) => (
            <li key={c.id} className="flex items-center gap-3 py-2.5">
              <button
                type="button"
                aria-label={c.done ? "Desmarcar" : "Marcar como feito"}
                onClick={() =>
                  onChange(items.map((i) => (i.id === c.id ? { ...i, done: !i.done } : i)))
                }
                className={cn(
                  "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition",
                  c.done ? "border-success bg-success text-white" : "border-card-border"
                )}
              >
                {c.done && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
              </button>
              <span
                className={cn(
                  "min-w-0 flex-1 text-sm",
                  c.done ? "text-muted line-through" : "text-ink"
                )}
              >
                {c.text}
              </span>
              <button
                type="button"
                aria-label="Remover"
                onClick={() => onChange(items.filter((i) => i.id !== c.id))}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-muted"
              >
                <X className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {suggestions.length > 0 && (
        <div>
          <p className="pb-2 text-xs font-medium uppercase tracking-wide text-muted">
            Sugestões
          </p>
          <div className="flex flex-wrap gap-1.5">
            {suggestions.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => add(s)}
                className="rounded-full bg-canvas-soft/50 px-3 py-1.5 text-xs font-medium text-ink transition active:scale-95"
              >
                + {s}
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

/* -------------------------------- Notas --------------------------------- */

function Notes({ value, onSave }: { value: string; onSave: (v: string) => void }) {
  const [draft, setDraft] = useState(value);
  const dirty = draft.trim() !== value.trim();

  // Autosave a moment after typing stops. Not on blur: iOS Safari doesn't
  // move focus to buttons, so switching tab would unmount without a blur.
  const saveRef = useRef(onSave);
  useEffect(() => {
    saveRef.current = onSave;
  });
  useEffect(() => {
    if (!dirty) return;
    const t = setTimeout(() => saveRef.current(draft.trim()), 700);
    return () => clearTimeout(t);
  }, [draft, dirty]);

  return (
    <section className="card space-y-2 p-4">
      <textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        rows={10}
        placeholder="Ideias, sítios que te recomendaram, contactos, códigos de reserva…"
        className="w-full resize-none rounded-2xl bg-canvas-soft/40 px-4 py-3 text-sm leading-relaxed text-ink outline-none ring-2 ring-transparent transition focus:bg-card-bg focus:ring-accent"
      />
      <p className="px-1 text-xs text-muted">{dirty ? "A guardar…" : "Guardado."}</p>
    </section>
  );
}
