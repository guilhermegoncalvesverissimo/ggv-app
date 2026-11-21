"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Account, Transaction, WalletEvent } from "./types";
import type { EventInput } from "./events";
import type { Budget } from "./types";
import { type Category, setCustomCategories } from "./categories";
import { normaliseAccountColor } from "./colors";
import {
  createAccount,
  createCategory,
  createTransaction,
  deleteAccount,
  deleteCategory,
  deleteTransaction,
  assignToEvent,
  createWalletEvent,
  deleteWalletEvent,
  patchWalletEvent,
  fetchWallet,
  patchAccount,
  patchTransaction,
  upsertBudget,
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
  const [customCategories, setCustomCats] = useState<Category[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [events, setEvents] = useState<WalletEvent[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const reconcileScheduled = useRef(false);

  // Keep the module registry in sync so categoryById/categoriesFor resolve
  // custom categories everywhere without prop drilling.
  const applyCats = useCallback((cats: Category[]) => {
    setCustomCats(cats);
    setCustomCategories(cats);
  }, []);

  const refetch = useCallback(async () => {
    try {
      const w = await fetchWallet();
      setAccounts(w.accounts);
      setTransactions(w.transactions);
      applyCats(w.categories);
      setBudgets(w.budgets);
      setEvents(w.events);
    } catch {
      /* api.ts redirects on 401; keep optimistic state otherwise */
    }
  }, [applyCats]);

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
          applyCats(fresh.categories);
          setBudgets(fresh.budgets);
          setEvents(fresh.events);
        } else {
          markMigrated();
          setAccounts(w.accounts);
          setTransactions(w.transactions);
          applyCats(w.categories);
          setBudgets(w.budgets);
          setEvents(w.events);
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
    (tx: Omit<Transaction, "id" | "createdAt" | "eventId"> & { eventId?: string | null }) => {
      const optimistic: Transaction = {
        ...tx,
        eventId: tx.eventId ?? undefined,
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
            eventId: tx.eventId ?? undefined,
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

  const updateTransaction = useCallback(
    (
      id: string,
      patch: {
        accountId?: string;
        type?: "income" | "expense";
        amountCents?: number;
        category?: string;
        note?: string;
        date?: string;
        eventId?: string | null;
      }
    ) => {
      setTransactions((prev) =>
        prev.map((t) =>
          t.id === id
            ? {
                ...t,
                ...patch,
                note: "note" in patch ? patch.note : t.note,
                eventId: "eventId" in patch ? patch.eventId ?? undefined : t.eventId,
              }
            : t
        )
      );
      if (id.startsWith("temp_")) return;
      void (async () => {
        try {
          await patchTransaction(id, patch);
        } catch {
          scheduleReconcile();
        }
      })();
    },
    [scheduleReconcile]
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

  const addCategory = useCallback(
    (input: {
      label: string;
      emoji: string;
      type: "income" | "expense";
    }): Category | null => {
      const label = input.label.trim();
      const emoji = input.emoji.trim();
      if (!label || !emoji) return null;
      const optimistic: Category = {
        id: tempId("c"),
        label,
        emoji,
        type: input.type,
        custom: true,
      };
      setCustomCats((prev) => {
        const next = [...prev, optimistic];
        setCustomCategories(next);
        return next;
      });

      void (async () => {
        try {
          const created = await createCategory({
            label,
            emoji,
            type: input.type,
          });
          setCustomCats((prev) => {
            const next = prev.map((c) =>
              c.id === optimistic.id ? created : c
            );
            setCustomCategories(next);
            return next;
          });
        } catch {
          setCustomCats((prev) => {
            const next = prev.filter((c) => c.id !== optimistic.id);
            setCustomCategories(next);
            return next;
          });
        }
      })();

      return optimistic;
    },
    []
  );

  const removeCategory = useCallback(
    (id: string) => {
      setCustomCats((prev) => {
        const next = prev.filter((c) => c.id !== id);
        setCustomCategories(next);
        return next;
      });
      if (id.startsWith("temp_")) return;
      void (async () => {
        try {
          await deleteCategory(id);
        } catch {
          scheduleReconcile();
        }
      })();
    },
    [scheduleReconcile]
  );

  /** Set (or clear, when amountCents<=0) a category's monthly budget. */
  const setBudget = useCallback(
    (category: string, amountCents: number) => {
      setBudgets((prev) => {
        const without = prev.filter((b) => b.category !== category);
        return amountCents > 0
          ? [...without, { category, amountCents }]
          : without;
      });
      void (async () => {
        try {
          await upsertBudget(category, amountCents);
        } catch {
          scheduleReconcile();
        }
      })();
    },
    [scheduleReconcile]
  );

  const addEvent = useCallback(
    (input: EventInput, onCreated?: (e: WalletEvent) => void) => {
      const optimistic: WalletEvent = { ...input, id: tempId("e"), createdAt: Date.now() };
      setEvents((prev) => [optimistic, ...prev]);
      void (async () => {
        try {
          const created = await createWalletEvent(input);
          setEvents((prev) => prev.map((e) => (e.id === optimistic.id ? created : e)));
          onCreated?.(created);
        } catch (err) {
          setEvents((prev) => prev.filter((e) => e.id !== optimistic.id));
          alert(err instanceof Error ? err.message : "Não foi possível criar o evento");
        }
      })();
    },
    []
  );

  const updateEvent = useCallback(
    (id: string, patch: Partial<EventInput>) => {
      setEvents((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e)));
      if (id.startsWith("temp_")) return;
      void patchWalletEvent(id, patch).catch(() => scheduleReconcile());
    },
    [scheduleReconcile]
  );

  /** Deletes the event; its transactions stay, just ungrouped. */
  const removeEvent = useCallback(
    (id: string) => {
      setEvents((prev) => prev.filter((e) => e.id !== id));
      setTransactions((prev) =>
        prev.map((t) => (t.eventId === id ? { ...t, eventId: undefined } : t))
      );
      if (id.startsWith("temp_")) return;
      void deleteWalletEvent(id).catch(() => scheduleReconcile());
    },
    [scheduleReconcile]
  );

  const setEventTransactions = useCallback(
    (eventId: string, change: { add: string[]; remove: string[] }) => {
      const add = new Set(change.add);
      const remove = new Set(change.remove);
      setTransactions((prev) =>
        prev.map((t) =>
          add.has(t.id)
            ? { ...t, eventId }
            : remove.has(t.id) && t.eventId === eventId
              ? { ...t, eventId: undefined }
              : t
        )
      );
      void assignToEvent(eventId, change).catch(() => scheduleReconcile());
    },
    [scheduleReconcile]
  );

  return {
    events,
    addEvent,
    updateEvent,
    removeEvent,
    setEventTransactions,
    accounts,
    transactions,
    customCategories,
    budgets,
    hydrated,
    addAccount,
    renameAccount,
    removeAccount,
    addTransaction,
    updateTransaction,
    removeTransaction,
    setBudget,
    addCategory,
    removeCategory,
  };
}
