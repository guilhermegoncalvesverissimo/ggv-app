"use client";

import { useMemo, useState } from "react";
import { Plus, TrendingDown, TrendingUp, Wallet } from "lucide-react";
import { useWallet } from "@/lib/wallet/useWallet";
import { formatCents } from "@/lib/wallet/format";
import {
  type Period,
  currentMonth,
  heroLabel,
  isInPeriod,
  periodLabel,
} from "@/lib/wallet/period";
import { AddTransactionSheet } from "./AddTransactionSheet";
import { PeriodSelector } from "./PeriodSelector";
import { Sparkline } from "./Sparkline";
import { AccountSheet } from "./AccountSheet";
import { AccountPickerPill } from "./AccountPickerPill";
import { SwipeableTxRow } from "./SwipeableTxRow";
import type { Account, Transaction } from "@/lib/wallet/types";

const TX_LIMIT = 20;

type AccountFilter = string | "all";

/**
 * The balance, the sparkline and the transaction list — everything that used to
 * sit under the wallet's tiles. The wallet landing page is tiles only now, so
 * this lives behind the "Transações" tile instead of being deleted.
 */
export function TransactionsBoard() {
  const {
    accounts,
    transactions,
    customCategories,
    hydrated,
    addAccount,
    addTransaction,
    updateTransaction,
    removeTransaction,
    addCategory,
  } = useWallet();
  const [addTxOpen, setAddTxOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [accountSheetOpen, setAccountSheetOpen] = useState(false);
  const [openSwipeId, setOpenSwipeId] = useState<string | null>(null);
  const [period, setPeriod] = useState<Period>(() => currentMonth());
  const [accountFilter, setAccountFilter] = useState<AccountFilter>("all");

  const accountById = useMemo(() => {
    const m = new Map<string, Account>();
    for (const a of accounts) m.set(a.id, a);
    return m;
  }, [accounts]);

  const filtered = useMemo(
    () =>
      transactions.filter((t) => {
        if (!isInPeriod(t.date, period)) return false;
        if (accountFilter !== "all" && t.accountId !== accountFilter) return false;
        return true;
      }),
    [transactions, period, accountFilter]
  );

  const stats = useMemo(() => {
    let income = 0;
    let expense = 0;
    for (const t of filtered) {
      if (t.type === "income") income += t.amountCents;
      else expense += t.amountCents;
    }
    return { income, expense, net: income - expense };
  }, [filtered]);

  const ordered = useMemo(
    () =>
      [...filtered].sort(
        (a, b) =>
          (b.date > a.date ? 1 : b.date < a.date ? -1 : 0) ||
          b.createdAt - a.createdAt
      ),
    [filtered]
  );

  const defaultAccountId =
    accountFilter !== "all" ? accountFilter : accounts[0]?.id ?? "";
  const showAccountBadges = accounts.length > 1;

  if (!hydrated) {
    return (
      <div className="card flex items-center justify-center p-10 text-sm text-muted">
        A carregar…
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        <div className="flex justify-end">
          <AccountPickerPill
            accounts={accounts}
            selected={accountFilter}
            onOpen={() => setAccountSheetOpen(true)}
          />
        </div>
        <PeriodSelector value={period} onChange={setPeriod} />
      </div>

      <section className="card p-6">
        <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted">
          <Wallet className="h-4 w-4" />
          {heroLabel(period)}
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span
            className={`text-4xl font-semibold tracking-tight ${
              stats.net < 0 ? "text-danger" : "text-ink"
            }`}
          >
            {formatCents(stats.net, { signed: stats.net !== 0 })}
          </span>
        </div>
        <div className="mt-3 -mx-1">
          <Sparkline transactions={filtered} positive={stats.net >= 0} />
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-canvas-soft/40 p-4">
            <div className="flex items-center gap-1.5 text-xs text-success">
              <TrendingUp className="h-3.5 w-3.5" /> Entradas
            </div>
            <div className="mt-1 text-lg font-semibold tabular-nums">
              {formatCents(stats.income)}
            </div>
          </div>
          <div className="rounded-2xl bg-canvas-soft/40 p-4">
            <div className="flex items-center gap-1.5 text-xs text-danger">
              <TrendingDown className="h-3.5 w-3.5" /> Saídas
            </div>
            <div className="mt-1 text-lg font-semibold tabular-nums">
              {formatCents(stats.expense)}
            </div>
          </div>
        </div>
      </section>

      <section className="card overflow-hidden">
        <div className="flex items-center justify-between px-5 pb-2 pt-5">
          <h2 className="text-sm font-semibold tracking-tight">Transações</h2>
          <span className="text-xs text-muted">
            {filtered.length} · {periodLabel(period)}
          </span>
        </div>
        {ordered.length === 0 ? (
          <p className="px-5 pb-5 pt-1 text-sm text-muted">
            Sem transações neste período.
          </p>
        ) : (
          <ul>
            {ordered.slice(0, TX_LIMIT).map((tx) => (
              <SwipeableTxRow
                key={tx.id}
                tx={tx}
                account={accountById.get(tx.accountId)}
                showAccountBadge={showAccountBadges}
                isOpen={openSwipeId === tx.id}
                onRequestOpen={() => setOpenSwipeId(tx.id)}
                onClose={() =>
                  setOpenSwipeId((id) => (id === tx.id ? null : id))
                }
                onDelete={() => {
                  removeTransaction(tx.id);
                  if (openSwipeId === tx.id) setOpenSwipeId(null);
                }}
                onTap={() => setEditingTx(tx)}
              />
            ))}
          </ul>
        )}
      </section>

      <button
        type="button"
        aria-label="Adicionar transação"
        onClick={() => setAddTxOpen(true)}
        className="fixed bottom-[calc(env(safe-area-inset-bottom)+5.5rem)] right-5 z-20 flex h-14 w-14 items-center justify-center rounded-full bg-elevated text-white shadow-[0_18px_40px_-12px_rgba(15,12,41,0.55)] transition active:scale-95"
      >
        <Plus className="h-6 w-6" strokeWidth={2.5} />
      </button>

      <AddTransactionSheet
        open={addTxOpen}
        onClose={() => setAddTxOpen(false)}
        onAdd={addTransaction}
        onAddCategory={addCategory}
        customCategories={customCategories}
        accounts={accounts}
        defaultAccountId={defaultAccountId}
      />
      <AddTransactionSheet
        open={!!editingTx}
        onClose={() => setEditingTx(null)}
        onAdd={addTransaction}
        onEdit={updateTransaction}
        onDelete={(id) => {
          removeTransaction(id);
          if (openSwipeId === id) setOpenSwipeId(null);
        }}
        editing={editingTx}
        onAddCategory={addCategory}
        customCategories={customCategories}
        accounts={accounts}
        defaultAccountId={defaultAccountId}
      />
      <AccountSheet
        open={accountSheetOpen}
        onClose={() => setAccountSheetOpen(false)}
        accounts={accounts}
        selected={accountFilter}
        onSelect={setAccountFilter}
        onAdd={addAccount}
      />
    </>
  );
}
