"use client";

import Link from "next/link";
import { ChevronRight, Target } from "lucide-react";
import { currentMonth, isInPeriod } from "@/lib/wallet/period";
import { formatCents } from "@/lib/wallet/format";
import type { Budget, Transaction } from "@/lib/wallet/types";

export function BudgetsCard({
  transactions,
  budgets,
}: {
  transactions: Transaction[];
  budgets: Budget[];
}) {
  const period = currentMonth();
  const totalBudget = budgets.reduce((s, b) => s + b.amountCents, 0);

  let spent = 0;
  if (totalBudget > 0) {
    const set = new Set(budgets.map((b) => b.category));
    for (const t of transactions) {
      if (t.type !== "expense") continue;
      if (!set.has(t.category)) continue;
      if (!isInPeriod(t.date, period)) continue;
      spent += t.amountCents;
    }
  }

  const pct = totalBudget > 0 ? (spent / totalBudget) * 100 : 0;
  const barColor =
    pct > 100 ? "bg-danger" : pct > 80 ? "bg-warn" : "bg-success";

  return (
    <Link
      href="/finance/budgets"
      className="card flex items-center gap-4 p-5 transition active:scale-[0.99]"
    >
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-canvas-soft">
        <Target className="h-5 w-5 text-ink" strokeWidth={2.25} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold tracking-tight">Budgets</h2>
          {totalBudget > 0 && (
            <span
              className={`text-xs font-semibold tabular-nums ${
                pct > 100 ? "text-danger" : "text-muted"
              }`}
            >
              {pct.toFixed(0)}%
            </span>
          )}
        </div>
        {totalBudget > 0 ? (
          <>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-canvas-soft">
              <div
                className={`h-full rounded-full ${barColor} transition-all`}
                style={{ width: `${Math.min(pct, 100)}%` }}
              />
            </div>
            <p className="mt-1.5 text-xs text-muted">
              {formatCents(spent)} de {formatCents(totalBudget)} este mês
            </p>
          </>
        ) : (
          <p className="mt-1 text-xs text-muted">
            Define limites mensais por categoria
          </p>
        )}
      </div>
      <ChevronRight className="h-5 w-5 shrink-0 text-muted" />
    </Link>
  );
}
