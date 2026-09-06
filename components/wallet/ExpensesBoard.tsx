"use client";

import { useMemo, useState } from "react";
import { TrendingDown } from "lucide-react";
import { useWallet } from "@/lib/wallet/useWallet";
import { formatCents } from "@/lib/wallet/format";
import {
  type Period,
  currentMonth,
  isInPeriod,
  periodLabel,
} from "@/lib/wallet/period";
import { PeriodSelector } from "./PeriodSelector";
import { CategoriesOverview } from "./CategoriesOverview";
import { AddTransactionSheet } from "./AddTransactionSheet";
import type { Transaction } from "@/lib/wallet/types";

/**
 * Everything expense-related, split out of the wallet so the "Despesas" tile
 * has somewhere to land. The wallet keeps the balance, budgets and the full
 * transaction list; the category breakdown lives here.
 */
export function ExpensesBoard() {
  const {
    transactions,
    customCategories,
    accounts,
    hydrated,
    addTransaction,
    updateTransaction,
    removeTransaction,
    addCategory,
  } = useWallet();
  const [period, setPeriod] = useState<Period>(() => currentMonth());
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);

  const filtered = useMemo(
    () => transactions.filter((t) => isInPeriod(t.date, period)),
    [transactions, period]
  );

  const total = useMemo(
    () =>
      filtered.reduce(
        (sum, t) => (t.type === "expense" ? sum + t.amountCents : sum),
        0
      ),
    [filtered]
  );

  const count = filtered.filter((t) => t.type === "expense").length;

  if (!hydrated) {
    return (
      <div className="card flex items-center justify-center p-10 text-sm text-muted">
        A carregar…
      </div>
    );
  }

  return (
    <>
      <PeriodSelector value={period} onChange={setPeriod} />

      <section className="card p-6">
        <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted">
          <TrendingDown className="h-4 w-4" />
          Total gasto · {periodLabel(period)}
        </div>
        <div className="mt-2 text-4xl font-semibold tracking-tight tabular-nums">
          {formatCents(total)}
        </div>
        <p className="mt-1 text-sm text-muted">
          {count === 0
            ? "Sem despesas neste período."
            : `${count} ${count === 1 ? "despesa" : "despesas"}`}
        </p>
      </section>

      <CategoriesOverview
        transactions={filtered}
        onEditTransaction={setEditingTx}
      />

      <AddTransactionSheet
        open={!!editingTx}
        onClose={() => setEditingTx(null)}
        onAdd={addTransaction}
        onEdit={updateTransaction}
        onDelete={(id) => removeTransaction(id)}
        editing={editingTx}
        onAddCategory={addCategory}
        customCategories={customCategories}
        accounts={accounts}
        defaultAccountId={accounts[0]?.id ?? ""}
      />
    </>
  );
}
