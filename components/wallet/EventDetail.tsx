"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, ListPlus, Pencil } from "lucide-react";
import { useWallet } from "@/lib/wallet/useWallet";
import { categoryById } from "@/lib/wallet/categories";
import { formatCents } from "@/lib/wallet/format";
import { eventRange, eventTotals } from "@/lib/wallet/eventStats";
import type { Transaction } from "@/lib/wallet/types";
import { cn } from "@/lib/utils";
import { AddTransactionSheet } from "./AddTransactionSheet";
import { AssignEventSheet } from "./AssignEventSheet";
import { EventFormSheet } from "./EventFormSheet";

export function EventDetail({ id }: { id: string }) {
  const router = useRouter();
  const w = useWallet();
  const [editOpen, setEditOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);

  const event = w.events.find((e) => e.id === id) ?? null;
  const txs = useMemo(
    () => w.transactions.filter((t) => t.eventId === id).sort((a, b) => b.date.localeCompare(a.date)),
    [w.transactions, id]
  );
  const totals = eventTotals(txs);

  const byCategory = useMemo(() => {
    const m = new Map<string, number>();
    for (const t of txs) if (t.type === "expense") m.set(t.category, (m.get(t.category) ?? 0) + t.amountCents);
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }, [txs]);

  const back = (
    <Link
      href="/finance/despesas"
      className="inline-flex items-center gap-1 text-sm font-medium text-muted transition hover:text-ink"
    >
      <ChevronLeft className="h-4 w-4" /> Despesas
    </Link>
  );

  if (!w.hydrated) {
    return <div className="card flex items-center justify-center p-10 text-sm text-muted">A carregar…</div>;
  }
  if (!event) {
    return (
      <div className="space-y-4 pt-1">
        {back}
        <div className="card p-6 text-center text-sm text-muted">Este evento já não existe.</div>
      </div>
    );
  }

  const defaultAccountId = w.accounts[0]?.id ?? "";

  return (
    <div className="space-y-4 pt-1">
      {back}

      <section className="card overflow-hidden">
        <div
          className="flex items-start gap-3 p-5 text-white"
          style={{ background: `linear-gradient(150deg, ${event.color}, ${event.color}bb)` }}
        >
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/20 text-2xl">
            {event.emoji ?? event.name[0]?.toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-semibold leading-tight tracking-tight">{event.name}</h1>
            {eventRange(event.startDate, event.endDate) && (
              <p className="mt-1 text-sm text-white/85">{eventRange(event.startDate, event.endDate)}</p>
            )}
          </div>
          <button
            type="button"
            aria-label="Editar evento"
            onClick={() => setEditOpen(true)}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/20 transition active:scale-95"
          >
            <Pencil className="h-4 w-4" />
          </button>
        </div>
        <div className="p-5">
          <p className="text-xs uppercase tracking-wide text-muted">Custou</p>
          <p className="mt-1 text-4xl font-semibold tracking-tight tabular-nums">{formatCents(totals.net)}</p>
          {totals.received > 0 && (
            <p className="mt-1 text-sm text-muted">
              Gastaste {formatCents(totals.spent)} · recebeste {formatCents(totals.received)} de volta
            </p>
          )}
          {byCategory.length > 0 && (
            <div className="mt-4 space-y-2">
              {byCategory.map(([cat, cents]) => {
                const c = categoryById(cat);
                return (
                  <div key={cat}>
                    <div className="flex justify-between text-sm">
                      <span className="text-ink">{c ? `${c.emoji} ${c.label}` : cat}</span>
                      <span className="tabular-nums text-muted">{formatCents(cents)}</span>
                    </div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-canvas-soft">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${(cents / Math.max(1, totals.spent)) * 100}%`, background: event.color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setAssignOpen(true)}
          className="flex flex-1 items-center justify-center gap-2 rounded-full bg-elevated px-4 py-3 text-sm font-medium text-white transition active:scale-[0.98]"
        >
          <ListPlus className="h-4 w-4" /> Escolher movimentos
        </button>
        <button
          type="button"
          onClick={() => setAddOpen(true)}
          className="rounded-full bg-canvas-soft/60 px-4 py-3 text-sm font-medium text-ink transition active:scale-[0.98]"
        >
          Nova despesa
        </button>
      </div>

      <section className="card divide-y divide-card-border px-4">
        {txs.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted">
            Ainda sem movimentos. Toca em “Escolher movimentos” para juntares despesas que já registaste.
          </p>
        ) : (
          txs.map((t) => {
            const c = categoryById(t.category);
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setEditingTx(t)}
                className="flex w-full items-center gap-3 py-3 text-left"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-canvas-soft/60">
                  {c?.emoji ?? "❓"}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-ink">{t.note || c?.label}</span>
                  <span className="block text-xs text-muted">
                    {t.date.split("-").reverse().slice(0, 2).join("/")} · {c?.label ?? t.category}
                  </span>
                </span>
                <span className={cn("shrink-0 text-sm tabular-nums", t.type === "income" ? "text-success" : "text-ink")}>
                  {formatCents(t.type === "expense" ? -t.amountCents : t.amountCents, { signed: true })}
                </span>
              </button>
            );
          })
        )}
      </section>

      <EventFormSheet
        open={editOpen}
        onClose={() => setEditOpen(false)}
        event={event}
        onSubmit={(v) => w.updateEvent(event.id, v)}
        onDelete={() => {
          w.removeEvent(event.id);
          router.replace("/finance/despesas");
        }}
      />
      <AssignEventSheet
        open={assignOpen}
        onClose={() => setAssignOpen(false)}
        event={event}
        events={w.events}
        transactions={w.transactions}
        onSave={(change) => w.setEventTransactions(event.id, change)}
      />
      <AddTransactionSheet
        open={addOpen || !!editingTx}
        onClose={() => {
          setAddOpen(false);
          setEditingTx(null);
        }}
        onAdd={w.addTransaction}
        onEdit={w.updateTransaction}
        onDelete={(txId) => w.removeTransaction(txId)}
        editing={editingTx}
        onAddCategory={w.addCategory}
        customCategories={w.customCategories}
        accounts={w.accounts}
        defaultAccountId={defaultAccountId}
        events={w.events}
        defaultEventId={event.id}
      />
    </div>
  );
}
