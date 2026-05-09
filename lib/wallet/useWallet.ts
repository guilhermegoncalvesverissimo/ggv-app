"use client";

import { useCallback, useEffect, useState } from "react";
import {
  type Account,
  type Transaction,
  type WalletState,
} from "./types";
import {
  emptyState,
  makeDefaultAccount,
  readWalletStorage,
  writeWalletStorage,
} from "./migrate";

function newId(prefix: string): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function useWallet() {
  const [state, setState] = useState<WalletState>(emptyState);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const initial = readWalletStorage();
    // Always ensure at least one account so the add-form has a destination.
    if (initial.accounts.length === 0) {
      initial.accounts.push(makeDefaultAccount());
    }
    setState(initial);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    writeWalletStorage(state);
  }, [state, hydrated]);

  const addAccount = useCallback(
    (input: { name: string; color: string; emoji?: string }) => {
      const trimmed = input.name.trim();
      if (!trimmed) return null;
      const account: Account = {
        id: newId("a"),
        name: trimmed,
        color: input.color,
        emoji: input.emoji?.trim() || undefined,
        createdAt: Date.now(),
      };
      setState((s) => ({ ...s, accounts: [...s.accounts, account] }));
      return account;
    },
    []
  );

  const renameAccount = useCallback((id: string, name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setState((s) => ({
      ...s,
      accounts: s.accounts.map((a) =>
        a.id === id ? { ...a, name: trimmed } : a
      ),
    }));
  }, []);

  const removeAccount = useCallback((id: string) => {
    setState((s) => {
      // Also drop all transactions belonging to this account.
      return {
        ...s,
        accounts: s.accounts.filter((a) => a.id !== id),
        transactions: s.transactions.filter((t) => t.accountId !== id),
      };
    });
  }, []);

  const addTransaction = useCallback(
    (tx: Omit<Transaction, "id" | "createdAt">) => {
      setState((s) => ({
        ...s,
        transactions: [
          ...s.transactions,
          { ...tx, id: newId("t"), createdAt: Date.now() },
        ],
      }));
    },
    []
  );

  const removeTransaction = useCallback((id: string) => {
    setState((s) => ({
      ...s,
      transactions: s.transactions.filter((t) => t.id !== id),
    }));
  }, []);

  return {
    accounts: state.accounts,
    transactions: state.transactions,
    hydrated,
    addAccount,
    renameAccount,
    removeAccount,
    addTransaction,
    removeTransaction,
  };
}
