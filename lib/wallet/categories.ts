import type { TxType } from "./types";

export type Category = {
  id: string;
  label: string;
  emoji: string;
  type: TxType;
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

export function categoryById(id: string): Category | undefined {
  return BY_ID.get(id);
}

export function categoriesFor(type: TxType): Category[] {
  return CATEGORIES.filter((c) => c.type === type);
}
