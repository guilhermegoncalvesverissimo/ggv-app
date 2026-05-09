export type Encounter = {
  id: string;
  /** Unix ms timestamp */
  at: number;
};

export type Person = {
  id: string;
  name: string;
  /** Optional emoji or short label shown when there's no avatar. */
  badge?: string;
  /** Optional compressed JPEG data URL. */
  avatar?: string;
  encounters: Encounter[];
  createdAt: number;
};

export const STORAGE_KEY = "ggv:people:v1";
