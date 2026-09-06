"use client";

import { useMemo, useState } from "react";
import { useWallet } from "@/lib/wallet/useWallet";
import { type Period, currentMonth, isInPeriod } from "@/lib/wallet/period";
import { WalletTiles } from "./WalletTiles";

/**
 * The wallet landing page is the tile carousel and nothing else.
 *
 * Everything that used to sit under it moved behind a tile rather than being
 * dropped: the balance, sparkline and transaction list are on /finance/transacoes,
 * the category breakdown on /finance/despesas. Keeping them reachable matters —
 * the add-transaction sheet lives with the list, so deleting the section would
 * have left no way to record anything.
 */
export function WalletBoard() {
  const { transactions, budgets, hydrated } = useWallet();
  const [period] = useState<Period>(() => currentMonth());

  const expense = useMemo(() => {
    let sum = 0;
    for (const t of transactions) {
      if (!isInPeriod(t.date, period)) continue;
      if (t.type === "expense") sum += t.amountCents;
    }
    return sum;
  }, [transactions, period]);

  return (
    <WalletTiles
      expenseCents={hydrated ? expense : 0}
      budgetCount={budgets.length}
      txCount={transactions.length}
      period={period}
    />
  );
}
