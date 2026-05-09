"use client";

import { useMemo, useState } from "react";
import { Plus, TrendingDown, TrendingUp, Wallet, Trash2 } from "lucide-react";
import { useWallet } from "@/lib/wallet/useWallet";
import { categoryById } from "@/lib/wallet/categories";
import { formatCents, formatDateRelative } from "@/lib/wallet/format";
import {
  type Period,
  HERO_LABELS,
  isInPeriod,
  PERIOD_LABELS,
} from "@/lib/wallet/period";
import { AddTransactionSheet } from "./AddTransactionSheet";
import { PeriodChips } from "./PeriodChips";
import { Sparkline } from "./Sparkline";
import { AccountSheet } from "./AccountSheet";
import { AccountPickerPill } from "./AccountPickerPill";
import type { Account, Transaction } from "@/lib/wallet/types";

const TX_LIMIT = 20;

type AccountFilter = string | "all";

export function WalletBoard() {
  const {
    accounts,
    transactions,
    hydrated,
    addAccount,
    addTransaction,
    removeTransaction,
  } = useWallet();
  const [addTxOpen, setAddTxOpen] = useState(false);
  const [accountSheetOpen, setAccountSheetOpen] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [period, setPeriod] = useState<Period>("thisMonth");
  const [accountFilter, setAccountFilter] = useState<AccountFilter>("all");

  // Map for fast account lookup in rows.
  const accountById = useMemo(() => {
    const m = new Map<string, Account>();
    for (const a of accounts) m.set(a.id, a);
    return m;
  }, [accounts]);

  // Filter once for the active period + account — shared by stats + list.
  const filtered = useMemo(() => {
    const now = new Date();
    return transactions.filter((t) => {
      if (!isInPeriod(t.date, period, now)) return false;
      if (accountFilter !== "all" && t.accountId !== accountFilter) return false;
      return true;
    });
  }, [transactions, period, accountFilter]);

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

  // Default account for the add-tx sheet: respect filter when set, else first.
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

  if (transactions.length === 0) {
    return (
      <>
        {/* Header row even on empty state — lets you create accounts */}
        <div className="flex items-center justify-end">
          <AccountPickerPill
            accounts={accounts}
            selected={accountFilter}
            onOpen={() => setAccountSheetOpen(true)}
          />
        </div>

        <section className="card p-6">
          <div className="flex items-center gap-3 text-xs uppercase tracking-wide text-muted">
            <Wallet className="h-4 w-4" />
            Saldo deste mês
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-4xl font-semibold tracking-tight">€0,00</span>
          </div>
        </section>

        <div className="card flex flex-col items-center gap-3 p-8 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-soft">
            <Wallet className="h-6 w-6 text-accent" strokeWidth={2.25} />
          </div>
          <h2 className="text-lg font-semibold tracking-tight">
            Ainda sem transações
          </h2>
          <p className="max-w-xs text-sm text-muted">
            Adiciona uma entrada ou saída para começares a ver o saldo deste
            mês.
          </p>
          <button
            type="button"
            onClick={() => setAddTxOpen(true)}
            className="mt-2 rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-white transition active:scale-95"
          >
            Adicionar transação
          </button>
        </div>

        <AddTransactionSheet
          open={addTxOpen}
          onClose={() => setAddTxOpen(false)}
          onAdd={addTransaction}
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

  return (
    <>
      <div className="flex items-center justify-between gap-2">
        <PeriodChips value={period} onChange={setPeriod} />
        <AccountPickerPill
          accounts={accounts}
          selected={accountFilter}
          onOpen={() => setAccountSheetOpen(true)}
        />
      </div>

      {/* Hero: net balance */}
      <section className="card p-6">
        <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted">
          <Wallet className="h-4 w-4" />
          {HERO_LABELS[period]}
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

      {/* Transaction list */}
      <section className="card overflow-hidden">
        <div className="flex items-center justify-between px-5 pb-2 pt-5">
          <h2 className="text-sm font-semibold tracking-tight">Transações</h2>
          <span className="text-xs text-muted">
            {filtered.length} · {PERIOD_LABELS[period]}
          </span>
        </div>
        {ordered.length === 0 ? (
          <p className="px-5 pb-5 pt-1 text-sm text-muted">
            Sem transações neste período.
          </p>
        ) : (
          <ul>
            {ordered.slice(0, TX_LIMIT).map((tx) => (
              <TxRow
                key={tx.id}
                tx={tx}
                account={accountById.get(tx.accountId)}
                showAccountBadge={showAccountBadges}
                isRemoving={removingId === tx.id}
                onRequestRemove={() =>
                  setRemovingId((id) => (id === tx.id ? null : tx.id))
                }
                onConfirmRemove={() => {
                  removeTransaction(tx.id);
                  setRemovingId(null);
                }}
              />
            ))}
          </ul>
        )}
      </section>

      {/* FAB */}
      <button
        type="button"
        aria-label="Adicionar transação"
        onClick={() => setAddTxOpen(true)}
        className="fixed bottom-[calc(env(safe-area-inset-bottom)+5.5rem)] right-5 z-20 flex h-14 w-14 items-center justify-center rounded-full bg-ink text-white shadow-[0_18px_40px_-12px_rgba(15,12,41,0.55)] transition active:scale-95"
      >
        <Plus className="h-6 w-6" strokeWidth={2.5} />
      </button>

      <AddTransactionSheet
        open={addTxOpen}
        onClose={() => setAddTxOpen(false)}
        onAdd={addTransaction}
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

function TxRow({
  tx,
  account,
  showAccountBadge,
  isRemoving,
  onRequestRemove,
  onConfirmRemove,
}: {
  tx: Transaction;
  account: Account | undefined;
  showAccountBadge: boolean;
  isRemoving: boolean;
  onRequestRemove: () => void;
  onConfirmRemove: () => void;
}) {
  const cat = categoryById(tx.category);
  const signed = tx.type === "income" ? tx.amountCents : -tx.amountCents;

  return (
    <li className="flex items-center gap-3 border-t border-canvas-soft/40 px-5 py-3 first:border-t-0">
      <div className="relative h-10 w-10 shrink-0">
        <div className="flex h-full w-full items-center justify-center rounded-full bg-canvas-soft/50 text-lg">
          {cat?.emoji ?? "❓"}
        </div>
        {showAccountBadge && account && (
          <span
            className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full ring-2 ring-white"
            style={{ background: account.color }}
            aria-label={`Conta: ${account.name}`}
          />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium text-ink">
          {cat?.label ?? "Outras"}
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted">
          <span>{formatDateRelative(tx.date)}</span>
          {tx.note && <span className="truncate">· {tx.note}</span>}
        </div>
      </div>
      {isRemoving ? (
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onRequestRemove}
            className="rounded-full px-3 py-1.5 text-xs text-muted"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirmRemove}
            className="rounded-full bg-danger px-3 py-1.5 text-xs font-medium text-white"
          >
            Apagar
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <span
            className={`text-sm font-semibold tabular-nums ${
              signed >= 0 ? "text-success" : "text-ink"
            }`}
          >
            {formatCents(signed, { signed: true })}
          </span>
          <button
            type="button"
            onClick={onRequestRemove}
            aria-label="Remover transação"
            className="flex h-7 w-7 items-center justify-center rounded-full text-muted-soft transition active:scale-90"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </li>
  );
}
