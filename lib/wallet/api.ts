import type { Account, Budget, Transaction } from "./types";
import type { Category } from "./categories";

/** Typed wrappers around /api/wallet*. Same-origin, session-cookie auth.
 *  Bounces to /login on 401. Mirrors lib/networking/api.ts. */

function notAuthorisedRedirect() {
  if (typeof window === "undefined") return;
  const next = window.location.pathname + window.location.search;
  window.location.href = `/login?next=${encodeURIComponent(next)}`;
}

async function api<T>(
  path: string,
  init?: RequestInit & { allow401?: boolean }
): Promise<T> {
  const { allow401, ...rest } = init ?? {};
  const r = await fetch(path, {
    credentials: "same-origin",
    cache: "no-store",
    ...rest,
    headers: {
      "Content-Type": "application/json",
      ...(rest?.headers ?? {}),
    },
  });
  if (r.status === 401 && !allow401) {
    notAuthorisedRedirect();
    throw new Error("Unauthorized");
  }
  if (!r.ok) {
    const j = (await r.json().catch(() => ({}))) as { error?: string };
    throw new Error(j.error ?? `HTTP ${r.status}`);
  }
  if (r.status === 204) return undefined as T;
  return (await r.json()) as T;
}

export async function fetchWallet(): Promise<{
  accounts: Account[];
  transactions: Transaction[];
  categories: Category[];
  budgets: Budget[];
}> {
  const j = await api<{
    accounts: Account[];
    transactions: Transaction[];
    categories?: Category[];
    budgets?: Budget[];
  }>("/api/wallet");
  return {
    accounts: j.accounts,
    transactions: j.transactions,
    categories: j.categories ?? [],
    budgets: j.budgets ?? [],
  };
}

export async function upsertBudget(
  category: string,
  amountCents: number
): Promise<void> {
  await api("/api/wallet/budgets", {
    method: "PUT",
    body: JSON.stringify({ category, amountCents }),
  });
}

export async function createCategory(input: {
  label: string;
  emoji: string;
  type: "income" | "expense";
}): Promise<Category> {
  const json = await api<{ category: Category }>("/api/wallet/categories", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return json.category;
}

export async function deleteCategory(id: string): Promise<void> {
  await api(`/api/wallet/categories/${id}`, { method: "DELETE" });
}

export async function createAccount(input: {
  name: string;
  color: string;
  emoji?: string;
  createdAt?: number;
}): Promise<Account> {
  const json = await api<{ account: Account }>("/api/wallet/accounts", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return json.account;
}

export async function patchAccount(
  id: string,
  patch: { name?: string; color?: string; emoji?: string | null }
): Promise<void> {
  await api(`/api/wallet/accounts/${id}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
}

export async function deleteAccount(id: string): Promise<void> {
  await api(`/api/wallet/accounts/${id}`, { method: "DELETE" });
}

export async function createTransaction(input: {
  accountId: string;
  type: "income" | "expense";
  amountCents: number;
  category: string;
  note?: string;
  date: string;
  createdAt?: number;
}): Promise<Transaction> {
  const json = await api<{ transaction: Transaction }>(
    "/api/wallet/transactions",
    {
      method: "POST",
      body: JSON.stringify(input),
    }
  );
  return json.transaction;
}

export async function patchTransaction(
  id: string,
  patch: {
    accountId?: string;
    type?: "income" | "expense";
    amountCents?: number;
    category?: string;
    note?: string;
    date?: string;
  }
): Promise<void> {
  await api(`/api/wallet/transactions/${id}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
}

export async function deleteTransaction(id: string): Promise<void> {
  await api(`/api/wallet/transactions/${id}`, { method: "DELETE" });
}
