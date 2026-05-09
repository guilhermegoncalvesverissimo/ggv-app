import {
  type Account,
  type Transaction,
  type WalletState,
  STORAGE_KEY,
  LEGACY_STORAGE_KEY,
} from "./types";
import { DEFAULT_ACCOUNT_COLOR } from "./colors";

function newId(prefix: string): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function makeDefaultAccount(): Account {
  return {
    id: newId("a"),
    name: "Pessoal",
    color: DEFAULT_ACCOUNT_COLOR,
    createdAt: Date.now(),
  };
}

export function emptyState(): WalletState {
  return { version: 2, accounts: [], transactions: [] };
}

/**
 * Read storage with one-shot migration from legacy v1 (transactions-only) to
 * v2 (accounts + transactions). Always returns a valid v2 state with at least
 * one default account if any data is present.
 */
export function readWalletStorage(): WalletState {
  if (typeof window === "undefined") return emptyState();

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as WalletState;
      if (parsed && parsed.version === 2 && Array.isArray(parsed.accounts)) {
        return parsed;
      }
    }
  } catch {
    // fall through to migration / empty
  }

  // Migrate from v1 if present.
  try {
    const legacy = window.localStorage.getItem(LEGACY_STORAGE_KEY);
    if (legacy) {
      const v1 = JSON.parse(legacy) as Omit<Transaction, "accountId">[];
      if (Array.isArray(v1) && v1.length > 0) {
        const account = makeDefaultAccount();
        const state: WalletState = {
          version: 2,
          accounts: [account],
          transactions: v1.map((t) => ({ ...t, accountId: account.id })),
        };
        return state;
      }
    }
  } catch {
    // ignore — fall through to empty
  }

  return emptyState();
}

export function writeWalletStorage(state: WalletState): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // quota / privacy — silently ignore.
  }
}
