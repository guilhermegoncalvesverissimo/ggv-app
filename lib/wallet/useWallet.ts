"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Account, Transaction } from "./types";
import { normaliseAccountColor } from "./colors";
import {
  createAccount,
  createTransaction,
  deleteAccount,
  deleteTransaction,
  fetchWallet,
  patchAccount,
} from "./api";

const LEGACY_KEY = "ggv:wallet:v2";
const MIGRATED_FLAG = "ggv:wallet:migrated";

type LegacyState = { accounts?: Account[]; transactions?: Transaction[] };

function tempId(prefix: string): string {
  return `temp_${prefix}_${Date.now()}_${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

function readLegacy(): LegacyState {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(LEGACY_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as LegacyState;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function hasMigrated(): boolean {
  if (typeof window === "undefined") return true;
  try {
    return window.localStorage.getItem(MIGRATED_FLAG) === "true";
  } catch {
    return false;
  }
}

function markMigrated() {
  try {
    window.localStorage.setItem(MIGRATED_FLAG, "true");
  } catch {
    /* ignore */
  }
}

/** Push legacy localStorage wallet into Supabase. Accounts get new server
 *  ids, so transactions are remapped via an old→new id table. */
async function migrateLegacy(): Promise<void> {
  const legacy = readLegacy();
  const accounts = legacy.accounts ?? [];
  const transactions = legacy.transactions ?? [];
  const idMap = new Map<string, string>();

  for (const a of accounts) {
    try {
      const created = await createAccount({
        name: a.name,
        color: normaliseAccountColor(a.color),
        emoji: a.emoji,
        createdAt: a.createdAt,
      });
      idMap.set(a.id, created.id);
    } catch {
      /* skip this account; its transactions will be dropped below */
    }
  }

  for (const t of transactions) {
    const newAccountId = idMap.get(t.accountId);
    if (!newAccountId) continue;
    try {
      await createTransaction({
        accountId: newAccountId,
        type: t.type,
        amountCents: t.amountCents,
        category: t.category,
        note: t.note,
        date: t.date,
        createdAt: t.createdAt,
      });
    } catch {
      /* skip and continue */
    }
  }
  markMigrated();
}

export function useWallet() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const reconcileScheduled = useRef(false);

  const refetch = useCallback(async () => {
    try {
      const w = await fetchWallet();
      setAccounts(w.accounts);
      setTransactions(w.transactions);
    } catch {
      /* api.ts redirects on 401; keep optimistic state otherwise */
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const w = await fetchWallet();
        if (cancelled) return;

        const legacy = readLegacy();
        const legacyHasData = (legacy.accounts ?? []).length > 0;

        if (w.accounts.length === 0 && !hasMigrated() && legacyHasData) {
          await migrateLegacy();
          const fresh = await fetchWallet();
          if (cancelled) return;
          setAccounts(fresh.accounts);
          setTransactions(fresh.transactions);
        } else {
          markMigrated();
          setAccounts(w.accounts);
          setTransactions(w.transactions);
        }
      } catch {
        /* swallow — 401 redirects, other errors leave empty */
      } finally {
        if (!cancelled) setHydrated(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const scheduleReconcile = useCallback(() => {
    if (reconcileScheduled.current) return;
    reconcileScheduled.current = true;
    setTimeout(() => {
      reconcileScheduled.current = false;
      void refetch();
    }, 300);
  }, [refetch]);

  const addAccount = useCallback(
    (input: { name: string; color: string; emoji?: string }): Account | null => {
      const trimmed = input.name.trim();
      if (!trimmed) return null;
      const optimistic: Account = {
        id: tempId("a"),
        name: trimmed,
        color: input.color,
        emoji: input.emoji?.trim() || undefined,
        createdAt: Date.now(),
      };
      setAccounts((prev) => [...prev, optimistic]);

      void (async () => {
        try {
          const created = await createAccount({
            name: trimmed,
            color: input.color,
            emoji: input.emoji,
          });
          setAccounts((prev) =>
            prev.map((a) => (a.id === optimistic.id ? created : a))
          );
          // Re-point any optimistic transactions created against the temp id.
          setTransactions((prev) =>
            prev.map((t) =>
              t.accountId === optimistic.id
                ? { ...t, accountId: created.id }
                : t
            )
          );
        } catch {
          setAccounts((prev) => prev.filter((a) => a.id !== optimistic.id));
        }
      })();

      return optimistic;
    },
    []
  );

  const renameAccount = useCallback(
    (id: string, name: string) => {
      const trimmed = name.trim();
      if (!trimmed) return;
      setAccounts((prev) =>
        prev.map((a) => (a.id === id ? { ...a, name: trimmed } : a))
      );
      if (id.startsWith("temp_")) return;
      void (async () => {
        try {
          await patchAccount(id, { name: trimmed });
        } catch {
          scheduleReconcile();
        }
      })();
    },
    [scheduleReconcile]
  );

  const removeAccount = useCallback(
    (id: string) => {
      setAccounts((prev) => prev.filter((a) => a.id !== id));
      setTransactions((prev) => prev.filter((t) => t.accountId !== id));
      if (id.startsWith("temp_")) return;
      void (async () => {
        try {
          await deleteAccount(id);
        } catch {
          scheduleReconcile();
        }
      })();
    },
    [scheduleReconcile]
  );

  const addTransaction = useCallback(
    (tx: Omit<Transaction, "id" | "createdAt">) => {
      const optimistic: Transaction = {
        ...tx,
        id: tempId("t"),
        createdAt: Date.now(),
      };
      setTransactions((prev) => [...prev, optimistic]);

      void (async () => {
        // Wait briefly if the account is still a temp id (account being created).
        let accountId = tx.accountId;
        if (accountId.startsWith("temp_")) {
          await new Promise((r) => setTimeout(r, 400));
          // Re-read: the addAccount reconcile may have rewritten our accountId.
          const live = await new Promise<string | null>((resolve) => {
            setTransactions((prev) => {
              const found = prev.find((t) => t.id === optimistic.id);
              resolve(found ? found.accountId : null);
              return prev;
            });
          });
          if (live && !live.startsWith("temp_")) accountId = live;
          else {
            // Account never settled — drop the optimistic tx.
            setTransactions((prev) =>
              prev.filter((t) => t.id !== optimistic.id)
            );
            return;
          }
        }

        try {
          const created = await createTransaction({
            accountId,
            type: tx.type,
            amountCents: tx.amountCents,
            category: tx.category,
            note: tx.note,
            date: tx.date,
          });
          setTransactions((prev) =>
            prev.map((t) => (t.id === optimistic.id ? created : t))
          );
        } catch {
          setTransactions((prev) =>
            prev.filter((t) => t.id !== optimistic.id)
          );
        }
      })();
    },
    []
  );

  const removeTransaction = useCallback(
    (id: string) => {
      setTransactions((prev) => prev.filter((t) => t.id !== id));
      if (id.startsWith("temp_")) return;
      void (async () => {
        try {
          await deleteTransaction(id);
        } catch {
          scheduleReconcile();
        }
      })();
    },
    [scheduleReconcile]
  );

  return {
    accounts,
    transactions,
    hydrated,
    addAccount,
    renameAccount,
    removeAccount,
    addTransaction,
    removeTransaction,
  };
}
