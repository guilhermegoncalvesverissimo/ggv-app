"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Campaign, CampaignInput } from "./types";
import {
  createCampaign,
  deleteCampaign,
  fetchCampaigns,
  patchCampaign,
} from "./api";

function tempId(): string {
  return `temp_c_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function useCashHunters() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const reconcileScheduled = useRef(false);

  const refetch = useCallback(async () => {
    try {
      setCampaigns(await fetchCampaigns());
    } catch {
      /* 401 redirects via api.ts */
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const fresh = await fetchCampaigns();
        if (!cancelled) setCampaigns(fresh);
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

  const addCampaign = useCallback(
    (input: CampaignInput): Campaign => {
      const now = Date.now();
      const optimistic: Campaign = {
        ...input,
        id: tempId(),
        createdAt: now,
        updatedAt: now,
      };
      setCampaigns((prev) => [optimistic, ...prev]);
      void (async () => {
        try {
          const created = await createCampaign(input);
          setCampaigns((prev) =>
            prev.map((c) => (c.id === optimistic.id ? created : c))
          );
        } catch {
          setCampaigns((prev) =>
            prev.filter((c) => c.id !== optimistic.id)
          );
        }
      })();
      return optimistic;
    },
    []
  );

  const updateCampaign = useCallback(
    (id: string, patch: Partial<CampaignInput>) => {
      setCampaigns((prev) =>
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
      setCampaigns((prev) => prev.filter((c) => c.id !== id));
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

  return {
    campaigns,
    hydrated,
    addCampaign,
    updateCampaign,
    removeCampaign,
  };
}
