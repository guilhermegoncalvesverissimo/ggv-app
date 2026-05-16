"use client";

import Link from "next/link";
import { ChevronRight, Target } from "lucide-react";
import { categoryById } from "@/lib/wallet/categories";
import { currentMonth, isInPeriod } from "@/lib/wallet/period";
import { formatCents } from "@/lib/wallet/format";
import type { Budget, Transaction } from "@/lib/wallet/types";

function barColor(pct: number): string {
  if (pct > 100) return "bg-danger";
  if (pct > 80) return "bg-warn";
  return "bg-success";
}

export function BudgetsCard({
  transactions,
  budgets,
}: {
  transactions: Transaction[];
  budgets: Budget[];
}) {
  const period = currentMonth();

  // Spent this month per category (only those with a budget).
  const spentByCat = new Map<string, number>();
  if (budgets.length > 0) {
    const set = new Set(budgets.map((b) => b.category));
    for (const t of transactions) {
      if (t.type !== "expense") continue;
      if (!set.has(t.category)) continue;
      if (!isInPeriod(t.date, period)) continue;
      spentByCat.set(
        t.category,
        (spentByCat.get(t.category) ?? 0) + t.amountCents
      );
    }
  }

  const totalBudget = budgets.reduce((s, b) => s + b.amountCents, 0);
  const totalSpent = budgets.reduce(
    (s, b) => s + (spentByCat.get(b.category) ?? 0),
    0
  );
  const totalPct = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  // Rows sorted by how close to (or over) the limit they are.
  const rows = budgets
    .map((b) => {
      const cat = categoryById(b.category);
      const spent = spentByCat.get(b.category) ?? 0;
      return {
        category: b.category,
        label: cat?.label ?? "Outras",
        emoji: cat?.emoji ?? "❓",
        spent,
        budget: b.amountCents,
        pct: b.amountCents > 0 ? (spent / b.amountCents) * 100 : 0,
      };
    })
    .sort((a, b) => b.pct - a.pct);

  return (
    <Link
      href="/finance/budgets"
      className="card block p-5 transition active:scale-[0.99]"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-canvas-soft">
          <Target className="h-4 w-4 text-ink" strokeWidth={2.25} />
        </div>
        <h2 className="flex-1 text-sm font-semibold tracking-tight">
          Budgets
        </h2>
        {totalBudget > 0 && (
          <span
            className={`text-xs font-semibold tabular-nums ${
              totalPct > 100 ? "text-danger" : "text-muted"
            }`}
          >
            {totalPct.toFixed(0)}%
          </span>
        )}
        <ChevronRight className="h-5 w-5 shrink-0 text-muted" />
      </div>

      {totalBudget === 0 ? (
        <p className="mt-3 text-xs text-muted">
          Define limites mensais por categoria
        </p>
      ) : (
        <>
          {/* Overall */}
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-canvas-soft">
            <div
              className={`h-full rounded-full ${barColor(
                totalPct
              )} transition-all`}
              style={{ width: `${Math.min(totalPct, 100)}%` }}
            />
          </div>
          <p className="mt-1.5 text-xs text-muted">
            {formatCents(totalSpent)} de {formatCents(totalBudget)} este mês
          </p>

          {/* Per-category breakdown */}
          <ul className="mt-4 space-y-3 border-t border-canvas-soft/60 pt-4">
            {rows.map((r) => (
              <li key={r.category}>
                <div className="flex items-center gap-2.5">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-canvas-soft text-xs">
                    {r.emoji}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm text-ink">
                    {r.label}
                  </span>
                  <span className="shrink-0 text-xs text-muted tabular-nums">
                    {formatCents(r.spent)} / {formatCents(r.budget)}
                  </span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-canvas-soft">
                  <div
                    className={`h-full rounded-full ${barColor(
                      r.pct
                    )} transition-all`}
                    style={{ width: `${Math.min(r.pct, 100)}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </Link>
  );
}
