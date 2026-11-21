"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight, Plus } from "lucide-react";
import { formatCents } from "@/lib/wallet/format";
import { eventRange, eventTotals } from "@/lib/wallet/eventStats";
import type { EventInput } from "@/lib/wallet/events";
import type { Transaction, WalletEvent } from "@/lib/wallet/types";
import { EventFormSheet } from "./EventFormSheet";

/** "Eventos" card on Despesas: each event with what it cost. */
export function EventsSection({
  events,
  transactions,
  onAdd,
}: {
  events: WalletEvent[];
  transactions: Transaction[];
  onAdd: (input: EventInput, onCreated?: (e: WalletEvent) => void) => void;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const totals = useMemo(() => {
    const m = new Map<string, Transaction[]>();
    for (const t of transactions) if (t.eventId) m.set(t.eventId, [...(m.get(t.eventId) ?? []), t]);
    return m;
  }, [transactions]);

  return (
    <section className="card p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold tracking-tight">Eventos</h2>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex items-center gap-1 rounded-full bg-canvas-soft/60 px-3 py-1.5 text-sm font-medium text-ink transition active:scale-95"
        >
          <Plus className="h-4 w-4" /> Novo
        </button>
      </div>

      {events.length === 0 ? (
        <p className="mt-2 text-sm text-muted">
          Agrupa despesas de um fim de semana fora, um casamento ou umas férias para
          saberes quanto custou no total.
        </p>
      ) : (
        <ul className="mt-3 divide-y divide-card-border">
          {events.map((e) => {
            const t = eventTotals(totals.get(e.id) ?? []);
            const range = eventRange(e.startDate, e.endDate);
            const pending = e.id.startsWith("temp_");
            return (
              <li key={e.id}>
                <Link
                  href={pending ? "#" : `/finance/eventos/${e.id}`}
                  className={`flex items-center gap-3 py-3 ${pending ? "pointer-events-none opacity-60" : ""}`}
                >
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-lg text-white"
                    style={{ background: `linear-gradient(160deg, ${e.color}, ${e.color}cc)` }}
                  >
                    {e.emoji ?? e.name[0]?.toUpperCase()}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-ink">{e.name}</span>
                    <span className="block text-xs text-muted">
                      {[range, `${t.count} ${t.count === 1 ? "movimento" : "movimentos"}`].filter(Boolean).join(" · ")}
                    </span>
                  </span>
                  <span className="shrink-0 text-sm font-semibold tabular-nums text-ink">
                    {formatCents(t.net)}
                  </span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted" />
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      <EventFormSheet
        open={open}
        onClose={() => setOpen(false)}
        onSubmit={(v) => onAdd(v, (created) => router.push(`/finance/eventos/${created.id}`))}
      />
    </section>
  );
}
