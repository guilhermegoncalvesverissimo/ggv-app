"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { Sheet } from "@/components/ui/Sheet";
import { categoriesFor } from "@/lib/wallet/categories";
import { formatCents, parseAmountToCents } from "@/lib/wallet/format";
import type { Transaction } from "@/lib/wallet/types";
import { cn } from "@/lib/utils";

type Part = { key: number; amount: string; category: string; note: string };

type Payload = {
  accountId: string;
  type: Transaction["type"];
  amountCents: number;
  category: string;
  note?: string;
  date: string;
  eventId?: string | null;
};

/**
 * Splits one transaction into parts, each with its own category — e.g. one
 * MB WAY to a friend that was fuel + dinner. The first part stays the
 * original transaction (edited); the others become new transactions with
 * the same date, account and event. The parts must add up to the total.
 */
export function SplitTransactionSheet({
  open,
  onClose,
  tx,
  onEdit,
  onAdd,
}: {
  open: boolean;
  onClose: () => void;
  tx: Transaction | null;
  onEdit: (id: string, patch: Payload) => void;
  onAdd: (tx: Payload) => void;
}) {
  const [parts, setParts] = useState<Part[]>([]);
  const [nextKey, setNextKey] = useState(2);

  // Start fresh each time it opens: the whole amount in the first part.
  const formKey = open && tx ? tx.id : null;
  const [lastKey, setLastKey] = useState<string | null>(null);
  if (formKey !== lastKey) {
    setLastKey(formKey);
    if (tx) {
      setParts([
        { key: 0, amount: (tx.amountCents / 100).toFixed(2), category: tx.category, note: "" },
        { key: 1, amount: "", category: tx.category, note: "" },
      ]);
      setNextKey(2);
    }
  }

  if (!tx) return <Sheet open={false} onClose={onClose}>{null}</Sheet>;

  const cats = categoriesFor(tx.type);
  const cents = parts.map((p) => parseAmountToCents(p.amount));
  // Part 1 absorbs whatever the others don't take, so you only type the
  // other amounts.
  const others = cents.slice(1).reduce((s, c) => s + (Number.isFinite(c) ? c : 0), 0);
  const first = tx.amountCents - others;
  const valid =
    parts.length >= 2 && first > 0 && cents.slice(1).every((c) => Number.isFinite(c) && c > 0);

  const update = (key: number, patch: Partial<Part>) =>
    setParts((prev) => prev.map((p) => (p.key === key ? { ...p, ...patch } : p)));

  const noteFor = (p: Part) => {
    const extra = p.note.trim();
    if (!extra) return tx.note;
    return tx.note ? `${tx.note} · ${extra}` : extra;
  };

  const save = () => {
    if (!valid) return;
    const base = {
      accountId: tx.accountId,
      type: tx.type,
      date: tx.date,
      eventId: tx.eventId ?? null,
    };
    onEdit(tx.id, { ...base, amountCents: first, category: parts[0].category, note: noteFor(parts[0]) });
    parts.slice(1).forEach((p, i) =>
      onAdd({ ...base, eventId: tx.eventId, amountCents: cents[i + 1], category: p.category, note: noteFor(p) })
    );
    onClose();
  };

  return (
    <Sheet open={open} onClose={onClose}>
      <div className="-mx-1 max-h-[80dvh] space-y-3 overflow-y-auto px-1 pb-1">
        <div className="px-1">
          <h2 className="text-lg font-semibold tracking-tight">Dividir {formatCents(tx.amountCents)}</h2>
          <p className="mt-0.5 text-sm text-muted">
            {tx.note ?? "Sem nota"} · escreve o valor das outras partes; a primeira fica com o resto.
          </p>
        </div>

        {parts.map((p, i) => (
          <div key={p.key} className="space-y-2 rounded-3xl bg-canvas-soft/40 p-3">
            <div className="flex items-center gap-2">
              <span className="w-14 shrink-0 text-xs font-medium uppercase tracking-wide text-muted">
                Parte {i + 1}
              </span>
              {i === 0 ? (
                <span className="flex-1 text-right text-lg font-semibold tabular-nums text-ink">
                  {formatCents(Math.max(0, first))}
                </span>
              ) : (
                <div className="flex flex-1 items-center justify-end gap-1">
                  <span className="text-muted">€</span>
                  <input
                    type="text"
                    inputMode="decimal"
                    autoFocus={i === 1}
                    value={p.amount}
                    onChange={(e) => update(p.key, { amount: e.target.value.replace(/[^0-9.,]/g, "").slice(0, 10) })}
                    placeholder="0,00"
                    className="w-28 rounded-2xl bg-card-bg px-3 py-2 text-right text-lg font-semibold tabular-nums text-ink outline-none ring-2 ring-transparent focus:ring-accent"
                  />
                </div>
              )}
              {i > 0 && parts.length > 2 && (
                <button
                  type="button"
                  aria-label="Remover parte"
                  onClick={() => setParts((prev) => prev.filter((x) => x.key !== p.key))}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <div className="-mx-3 overflow-x-auto px-3">
              <div className="flex gap-1.5 pb-0.5">
                {cats.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => update(p.key, { category: c.id })}
                    className={cn(
                      "flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1.5 text-xs font-medium transition",
                      p.category === c.id ? "bg-elevated text-white" : "bg-card-bg text-ink"
                    )}
                  >
                    <span aria-hidden>{c.emoji}</span>
                    {c.label}
                  </button>
                ))}
              </div>
            </div>
            <input
              type="text"
              value={p.note}
              onChange={(e) => update(p.key, { note: e.target.value.slice(0, 60) })}
              placeholder={i === 0 ? "Detalhe (ex.: gasóleo) — opcional" : "Detalhe (ex.: jantar) — opcional"}
              className="w-full rounded-2xl bg-card-bg px-3 py-2 text-sm text-ink outline-none ring-2 ring-transparent focus:ring-accent"
            />
          </div>
        ))}

        <button
          type="button"
          onClick={() => {
            setParts((prev) => [...prev, { key: nextKey, amount: "", category: tx.category, note: "" }]);
            setNextKey((k) => k + 1);
          }}
          className="flex w-full items-center justify-center gap-1.5 rounded-full border border-dashed border-card-border px-4 py-2.5 text-sm font-medium text-ink"
        >
          <Plus className="h-4 w-4" /> Mais uma parte
        </button>

        {first <= 0 && (
          <p className="px-1 text-sm text-danger">As partes passam o total de {formatCents(tx.amountCents)}.</p>
        )}

        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-full bg-canvas-soft/50 px-4 py-3 text-sm font-medium text-ink transition active:scale-[0.98]"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={!valid}
            onClick={save}
            className="flex-1 rounded-full bg-elevated px-4 py-3 text-sm font-medium text-white transition active:scale-[0.98] disabled:opacity-40"
          >
            Dividir em {parts.length}
          </button>
        </div>
      </div>
    </Sheet>
  );
}
