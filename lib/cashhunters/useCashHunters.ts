"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Campaign, CampaignInput, Kind } from "./types";
import {
  createCampaign,
  deleteCampaign,
  fetchCampaigns,
  patchCampaign,
} from "./api";

function tempId(): string {
  return `temp_c_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * One hook for both kinds. Internally we keep a single list and split by kind
 * on read so callers can render the two sections (campaigns + cards) without
 * worrying about ordering or state divergence.
 */
export function useCashHunters() {
  const [items, setItems] = useState<Campaign[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const reconcileScheduled = useRef(false);

  const refetch = useCallback(async () => {
    try {
      const fresh = await fetchCampaigns();
      setItems([...fresh.campaigns, ...fresh.cards]);
    } catch {
      /* 401 redirects via api.ts */
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const fresh = await fetchCampaigns();
        if (!cancelled) setItems([...fresh.campaigns, ...fresh.cards]);
      } catch {
        /* swallow */
      } finally {
        if (!cancelled) setHydrated(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const scheduleReconcile = useCallback(() => {
    if (reconcileScheduled.current) return;
    reconcileScheduled.current = true;
    setTimeout(() => {
      reconcileScheduled.current = false;
      void refetch();
    }, 300);
  }, [refetch]);

  const addItem = useCallback(
    (input: CampaignInput): Campaign => {
      const now = Date.now();
      const optimistic: Campaign = {
        ...input,
        id: tempId(),
        createdAt: now,
        updatedAt: now,
      };
      setItems((prev) => [optimistic, ...prev]);
      void (async () => {
        try {
          const created = await createCampaign(input);
          setItems((prev) =>
            prev.map((c) => (c.id === optimistic.id ? created : c))
          );
        } catch {
          setItems((prev) => prev.filter((c) => c.id !== optimistic.id));
        }
      })();
      return optimistic;
    },
    []
  );

  const addCampaign = useCallback(
    (input: Omit<CampaignInput, "kind">): Campaign =>
      addItem({ ...input, kind: "campaign" }),
    [addItem]
  );

  const addCard = useCallback(
    (input: Omit<CampaignInput, "kind">): Campaign =>
      addItem({ ...input, kind: "card" }),
    [addItem]
  );

  const updateCampaign = useCallback(
    (id: string, patch: Partial<CampaignInput>) => {
      setItems((prev) =>
        prev.map((c) =>
          c.id === id ? { ...c, ...patch, updatedAt: Date.now() } : c
        )
      );
      if (id.startsWith("temp_")) return;
      void (async () => {
        try {
          await patchCampaign(id, patch);
        } catch {
          scheduleReconcile();
        }
      })();
    },
    [scheduleReconcile]
  );

  const removeCampaign = useCallback(
    (id: string) => {
      setItems((prev) => prev.filter((c) => c.id !== id));
      if (id.startsWith("temp_")) return;
      void (async () => {
        try {
          await deleteCampaign(id);
        } catch {
          scheduleReconcile();
        }
      })();
    },
    [scheduleReconcile]
  );

  const byKind = useCallback(
    (kind: Kind) => items.filter((c) => c.kind === kind),
    [items]
  );

  const campaigns = useMemo(() => byKind("campaign"), [byKind]);
  const cards = useMemo(() => byKind("card"), [byKind]);

  return {
    campaigns,
    cards,
    hydrated,
    addCampaign,
    addCard,
    updateCampaign,
    removeCampaign,
  };
}
