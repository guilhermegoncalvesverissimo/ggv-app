export type Step = {
  id: string;
  label: string;
  done: boolean;
};

/**
 * Both cashback campaigns ('campaign') and credit-card flow schemes ('card')
 * share the same shape: name + url + a step list, with a kind discriminator
 * so the UI can render them in two separate sections.
 */
export type Kind = "campaign" | "card";

export type Campaign = {
  id: string;
  kind: Kind;
  name: string;
  url?: string;
  /** Goal value to earn from this cashback campaign, in cents. Used as
   *  reference amount on cards too. */
  targetCents: number;
  steps: Step[];
  createdAt: number;
  updatedAt: number;
};

export type CampaignInput = Omit<Campaign, "id" | "createdAt" | "updatedAt">;
