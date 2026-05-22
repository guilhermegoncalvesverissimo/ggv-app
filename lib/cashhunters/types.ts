export type Step = {
  id: string;
  label: string;
  done: boolean;
};

export type Campaign = {
  id: string;
  name: string;
  url?: string;
  /** Goal value to earn from this cashback campaign, in cents. */
  targetCents: number;
  steps: Step[];
  createdAt: number;
  updatedAt: number;
};

export type CampaignInput = Omit<Campaign, "id" | "createdAt" | "updatedAt">;
