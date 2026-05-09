export type Encounter = {
  /** Unix ms timestamp */
  at: number;
};

export type Person = {
  id: string;
  name: string;
  /** Optional emoji or short label shown when there's no avatar. */
  badge?: string;
  encounters: Encounter[];
  createdAt: number;
};

export const STORAGE_KEY = "ggv:people:v1";
