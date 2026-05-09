export type TxType = "income" | "expense";

export type Transaction = {
  id: string;
  type: TxType;
  /** Always positive cents. Sign is derived from `type`. */
  amountCents: number;
  /** Category id from `lib/wallet/categories.ts`. */
  category: string;
  note?: string;
  /** ISO date `YYYY-MM-DD`. */
  date: string;
  createdAt: number;
};

export const STORAGE_KEY = "ggv:wallet:v1";
