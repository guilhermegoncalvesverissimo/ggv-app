"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Sheet } from "@/components/ui/Sheet";
import { categoriesFor } from "@/lib/wallet/categories";
import { parseAmountToCents, todayIso } from "@/lib/wallet/format";
import type { Account, TxType } from "@/lib/wallet/types";

export function AddTransactionSheet({
  open,
  onClose,
  onAdd,
  accounts,
  defaultAccountId,
}: {
  open: boolean;
  onClose: () => void;
  onAdd: (tx: {
    accountId: string;
    type: TxType;
    amountCents: number;
    category: string;
    note?: string;
    date: string;
  }) => void;
  accounts: Account[];
  defaultAccountId: string;
}) {
  const [type, setType] = useState<TxType>("expense");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [date, setDate] = useState(todayIso());
  const [accountId, setAccountId] = useState<string>(defaultAccountId);
  const amountRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setType("expense");
      setAmount("");
      setCategory(null);
      setNote("");
      setDate(todayIso());
      setAccountId(defaultAccountId);
      const t = setTimeout(() => amountRef.current?.focus(), 250);
      return () => clearTimeout(t);
    }
  }, [open, defaultAccountId]);

  const visibleCategories = useMemo(() => categoriesFor(type), [type]);

  // Auto-clear category when switching types
  useEffect(() => {
    if (category && !visibleCategories.find((c) => c.id === category)) {
      setCategory(null);
    }
  }, [category, visibleCategories]);

  const cents = parseAmountToCents(amount);
  const valid =
    Number.isFinite(cents) &&
    cents > 0 &&
    !!category &&
    !!date &&
    !!accountId;

  const submit = () => {
    if (!valid || !category) return;
    onAdd({
      accountId,
      type,
      amountCents: cents,
      category,
      note: note.trim() || undefined,
      date,
    });
    onClose();
  };

  return (
    <Sheet open={open} onClose={onClose}>
      {/* Type toggle */}
      <div className="flex rounded-full bg-canvas-soft/40 p-1">
        {(["expense", "income"] as TxType[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setType(t)}
            className={`flex-1 rounded-full px-4 py-2 text-sm font-medium transition ${
              type === t
                ? t === "expense"
                  ? "bg-danger text-white shadow-sm"
                  : "bg-success text-white shadow-sm"
                : "text-muted"
            }`}
          >
            {t === "expense" ? "Saída" : "Entrada"}
          </button>
        ))}
      </div>

      <form
        className="space-y-4 pt-4"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        {/* Amount */}
        <div className="flex items-baseline justify-center gap-2 px-2">
          <span className="text-3xl font-semibold text-muted-soft">€</span>
          <input
            ref={amountRef}
            type="text"
            inputMode="decimal"
            autoComplete="off"
            value={amount}
            onChange={(e) =>
              setAmount(e.target.value.replace(/[^0-9.,]/g, "").slice(0, 10))
            }
            placeholder="0,00"
            className="w-40 bg-transparent text-center text-5xl font-semibold tracking-tight tabular-nums text-ink outline-none placeholder:text-muted-soft/50"
          />
        </div>

        {/* Account picker — only when there are multiple accounts */}
        {accounts.length > 1 && (
          <div className="-mx-5 overflow-x-auto px-5">
            <div className="flex gap-2 pb-1">
              {accounts.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => setAccountId(a.id)}
                  className={`flex shrink-0 items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium transition ${
                    accountId === a.id
                      ? "bg-ink text-white"
                      : "bg-canvas-soft/40 text-ink"
                  }`}
                >
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ background: a.color }}
                    aria-hidden
                  />
                  <span>
                    {a.emoji ? `${a.emoji} ` : ""}
                    {a.name}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Categories */}
        <div className="-mx-5 overflow-x-auto px-5">
          <div className="flex gap-2 pb-1">
            {visibleCategories.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setCategory(c.id)}
                className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium transition ${
                  category === c.id
                    ? "bg-ink text-white"
                    : "bg-canvas-soft/40 text-ink"
                }`}
              >
                <span>{c.emoji}</span>
                <span>{c.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Date + note */}
        <div className="grid grid-cols-2 gap-2">
          <label className="block">
            <span className="text-xs font-medium uppercase tracking-wide text-muted">
              Data
            </span>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="mt-1 w-full rounded-2xl bg-canvas-soft/40 px-3 py-2.5 text-sm text-ink outline-none ring-2 ring-transparent transition focus:bg-white focus:ring-accent"
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium uppercase tracking-wide text-muted">
              Nota
            </span>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value.slice(0, 80))}
              placeholder="Opcional"
              className="mt-1 w-full rounded-2xl bg-canvas-soft/40 px-3 py-2.5 text-sm text-ink outline-none ring-2 ring-transparent transition focus:bg-white focus:ring-accent"
            />
          </label>
        </div>

        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-full bg-canvas-soft/50 px-4 py-3 text-sm font-medium text-ink transition active:scale-[0.98]"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={!valid}
            className="flex-1 rounded-full bg-ink px-4 py-3 text-sm font-medium text-white transition active:scale-[0.98] disabled:opacity-40"
          >
            Guardar
          </button>
        </div>
      </form>
    </Sheet>
  );
}
