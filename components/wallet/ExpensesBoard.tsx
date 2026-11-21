"use client";

import { useMemo, useState } from "react";
import { FileUp, Plus, TrendingDown, Zap } from "lucide-react";
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
import { ApplePaySheet } from "./ApplePaySheet";
import { ImportStatementSheet } from "./ImportStatementSheet";
import { EventsSection } from "./EventsSection";
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
    events,
    addEvent,
  } = useWallet();
  const [period, setPeriod] = useState<Period>(() => currentMonth());
  const [addTxOpen, setAddTxOpen] = useState(false);
  const [applePayOpen, setApplePayOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
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

      <EventsSection events={events} transactions={transactions} onAdd={addEvent} />

      <button
        type="button"
        onClick={() => setApplePayOpen(true)}
        className="card flex w-full items-center gap-3 p-4 text-left transition active:scale-[0.99]"
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-canvas-soft/60">
          <Zap className="h-5 w-5 text-ink" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold text-ink">Apple Pay automático</span>
          <span className="block text-xs text-muted">
            Regista sozinho cada pagamento feito com o iPhone
          </span>
        </span>
      </button>

      <button
        type="button"
        onClick={() => setImportOpen(true)}
        className="card flex w-full items-center gap-3 p-4 text-left transition active:scale-[0.99]"
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-canvas-soft/60">
          <FileUp className="h-5 w-5 text-ink" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold text-ink">Importar extrato</span>
          <span className="block text-xs text-muted">
            Traz o histórico do Revolut a partir do extrato (PDF ou CSV)
          </span>
        </span>
      </button>

      <ApplePaySheet open={applePayOpen} onClose={() => setApplePayOpen(false)} />
      <ImportStatementSheet
        open={importOpen}
        onClose={() => setImportOpen(false)}
        accounts={accounts}
        transactions={transactions}
        events={events}
        onAdd={addTransaction}
      />

      <button
        type="button"
        aria-label="Adicionar despesa"
        onClick={() => setAddTxOpen(true)}
        className="fixed bottom-[calc(var(--nav-bottom)+5.5rem)] right-5 z-20 flex h-14 w-14 items-center justify-center rounded-full bg-elevated text-white shadow-[0_18px_40px_-12px_rgba(15,12,41,0.55)] transition active:scale-95"
      >
        <Plus className="h-6 w-6" strokeWidth={2.5} />
      </button>

      {/* Opens on "Despesa" by default (the sheet resets to expense). */}
      <AddTransactionSheet
        open={addTxOpen}
        onClose={() => setAddTxOpen(false)}
        onAdd={addTransaction}
        onAddCategory={addCategory}
        customCategories={customCategories}
        accounts={accounts}
        defaultAccountId={accounts[0]?.id ?? ""}
        events={events}
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
        events={events}
      />
    </>
  );
}
