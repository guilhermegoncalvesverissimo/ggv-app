"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useWallet } from "@/lib/wallet/useWallet";
import { categoriesFor } from "@/lib/wallet/categories";
import {
  type Period,
  currentMonth,
  isInPeriod,
  periodLabel,
  stepPeriod,
} from "@/lib/wallet/period";
import { formatCents, parseAmountToCents } from "@/lib/wallet/format";

export function BudgetsBoard() {
  const { transactions, budgets, customCategories, hydrated, setBudget } =
    useWallet();
  const [period, setPeriod] = useState<Period>(() => currentMonth());

  // Built-in + custom expense categories.
  const cats = useMemo(
    () => categoriesFor("expense"),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [customCategories]
  );

  const budgetByCat = useMemo(
    () => new Map(budgets.map((b) => [b.category, b.amountCents])),
    [budgets]
  );

  const spentByCat = useMemo(() => {
    const m = new Map<string, number>();
    for (const t of transactions) {
      if (t.type !== "expense") continue;
      if (!isInPeriod(t.date, period)) continue;
      m.set(t.category, (m.get(t.category) ?? 0) + t.amountCents);
    }
    return m;
  }, [transactions, period]);

  if (!hydrated) {
    return (
      <div className="card flex items-center justify-center p-10 text-sm text-muted">
        A carregar…
      </div>
    );
  }

  // Categories with a budget first, then by spend desc.
  const ordered = [...cats].sort((a, b) => {
    const ba = budgetByCat.get(a.id) ?? 0;
    const bb = budgetByCat.get(b.id) ?? 0;
    if ((ba > 0) !== (bb > 0)) return ba > 0 ? -1 : 1;
    return (spentByCat.get(b.id) ?? 0) - (spentByCat.get(a.id) ?? 0);
  });

  return (
    <>
      {/* Month stepper */}
      <div className="flex justify-center">
        <div className="flex items-center gap-0.5 rounded-full bg-canvas-soft p-1">
          <button
            type="button"
            aria-label="Mês anterior"
            onClick={() => setPeriod((p) => stepPeriod(p, -1))}
            className="flex h-7 w-7 items-center justify-center rounded-full text-ink transition active:scale-90"
          >
            <ChevronLeft className="h-4 w-4" strokeWidth={2.5} />
          </button>
          <span className="min-w-[104px] text-center text-sm font-semibold tracking-tight text-ink">
            {periodLabel(period)}
          </span>
          <button
            type="button"
            aria-label="Mês seguinte"
            onClick={() => setPeriod((p) => stepPeriod(p, 1))}
            className="flex h-7 w-7 items-center justify-center rounded-full text-ink transition active:scale-90"
          >
            <ChevronRight className="h-4 w-4" strokeWidth={2.5} />
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {ordered.map((c) => (
          <BudgetRow
            key={c.id}
            emoji={c.emoji}
            label={c.label}
            budgetCents={budgetByCat.get(c.id) ?? 0}
            spentCents={spentByCat.get(c.id) ?? 0}
            onSave={(cents) => setBudget(c.id, cents)}
          />
        ))}
      </div>
    </>
  );
}

function BudgetRow({
  emoji,
  label,
  budgetCents,
  spentCents,
  onSave,
}: {
  emoji: string;
  label: string;
  budgetCents: number;
  spentCents: number;
  onSave: (cents: number) => void;
}) {
  const [draft, setDraft] = useState(
    budgetCents > 0 ? (budgetCents / 100).toFixed(2) : ""
  );

  const commit = () => {
    const cents = parseAmountToCents(draft);
    const next = Number.isFinite(cents) && cents > 0 ? cents : 0;
    if (next !== budgetCents) onSave(next);
    setDraft(next > 0 ? (next / 100).toFixed(2) : "");
  };

  const has = budgetCents > 0;
  const pct = has ? (spentCents / budgetCents) * 100 : 0;
  const over = pct > 100;
  const barColor = over
    ? "bg-danger"
    : pct > 80
      ? "bg-warn"
      : "bg-success";
  const remaining = budgetCents - spentCents;

  return (
    <div className="card p-4">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-canvas-soft text-lg">
          {emoji}
        </span>
        <span className="min-w-0 flex-1 truncate text-sm font-medium text-ink">
          {label}
        </span>
        <div className="flex items-center gap-1 rounded-xl bg-canvas-soft px-2.5 py-1.5">
          <span className="text-sm text-muted">€</span>
          <input
            type="text"
            inputMode="decimal"
            value={draft}
            onChange={(e) =>
              setDraft(e.target.value.replace(/[^0-9.,]/g, "").slice(0, 10))
            }
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                (e.target as HTMLInputElement).blur();
              }
            }}
            placeholder="0,00"
            aria-label={`Budget para ${label}`}
            className="w-20 bg-transparent text-right text-sm font-semibold tabular-nums text-ink outline-none placeholder:text-muted-soft/60"
          />
        </div>
      </div>

      {has && (
        <div className="mt-3">
          <div className="h-2 overflow-hidden rounded-full bg-canvas-soft">
            <div
              className={`h-full rounded-full ${barColor} transition-all`}
              style={{ width: `${Math.min(pct, 100)}%` }}
            />
          </div>
          <div className="mt-1.5 flex items-center justify-between text-xs">
            <span className="text-muted">
              {formatCents(spentCents)} / {formatCents(budgetCents)}
            </span>
            <span
              className={
                over ? "font-semibold text-danger" : "text-muted"
              }
            >
              {over
                ? `${formatCents(-remaining)} acima`
                : `${formatCents(remaining)} restante`}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
