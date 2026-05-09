export type TxType = "income" | "expense";

export type Account = {
  id: string;
  name: string;
  /** Hex color for the dot/ring. */
  color: string;
  /** Optional single emoji shown next to the name. */
  emoji?: string;
  createdAt: number;
};

export type Transaction = {
  id: string;
  accountId: string;
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

export type WalletState = {
  version: 2;
  accounts: Account[];
  transactions: Transaction[];
};

export const STORAGE_KEY = "ggv:wallet:v2";
export const LEGACY_STORAGE_KEY = "ggv:wallet:v1";
