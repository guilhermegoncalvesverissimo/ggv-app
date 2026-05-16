import type { TxType } from "./types";

export type Category = {
  id: string;
  label: string;
  emoji: string;
  type: TxType;
  /** true for user-created categories (stored in Supabase). */
  custom?: boolean;
};

export const CATEGORIES: Category[] = [
  // Saídas
  { id: "food", label: "Comida", emoji: "🍽️", type: "expense" },
  { id: "transport", label: "Transporte", emoji: "🚗", type: "expense" },
  { id: "home", label: "Casa", emoji: "🏠", type: "expense" },
  { id: "bills", label: "Contas", emoji: "💡", type: "expense" },
  { id: "leisure", label: "Lazer", emoji: "🎬", type: "expense" },
  { id: "shopping", label: "Compras", emoji: "🛒", type: "expense" },
  { id: "health", label: "Saúde", emoji: "💊", type: "expense" },
  { id: "education", label: "Formação", emoji: "🎓", type: "expense" },
  { id: "subscriptions", label: "Subscrições", emoji: "🔁", type: "expense" },
  { id: "other-expense", label: "Outras", emoji: "❓", type: "expense" },

  // Entradas
  { id: "salary", label: "Salário", emoji: "💰", type: "income" },
  { id: "freelance", label: "Freelance", emoji: "💼", type: "income" },
  { id: "investment", label: "Investimento", emoji: "📈", type: "income" },
  { id: "gift", label: "Presente", emoji: "🎁", type: "income" },
  { id: "refund", label: "Reembolso", emoji: "↩️", type: "income" },
  { id: "other-income", label: "Outras", emoji: "❓", type: "income" },
];

const BY_ID = new Map(CATEGORIES.map((c) => [c.id, c]));

/**
 * Module-level registry of the user's custom categories. useWallet keeps this
 * in sync after loading them from Supabase, so the pure `categoryById` /
 * `categoriesFor` helpers (used in many components) resolve custom categories
 * too — no prop drilling needed. Client-only; SSR renders built-ins.
 */
let CUSTOM = new Map<string, Category>();

export function setCustomCategories(list: Category[]): void {
  CUSTOM = new Map(list.map((c) => [c.id, { ...c, custom: true }]));
}

export function categoryById(id: string): Category | undefined {
  return BY_ID.get(id) ?? CUSTOM.get(id);
}

export function categoriesFor(type: TxType): Category[] {
  const builtIn = CATEGORIES.filter((c) => c.type === type);
  const custom = [...CUSTOM.values()].filter((c) => c.type === type);
  return [...builtIn, ...custom];
}
