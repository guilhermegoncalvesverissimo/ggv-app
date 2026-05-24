import type { Campaign, CampaignInput } from "./types";

function notAuthorisedRedirect() {
  if (typeof window === "undefined") return;
  const next = window.location.pathname + window.location.search;
  window.location.href = `/login?next=${encodeURIComponent(next)}`;
}

async function api<T>(
  path: string,
  init?: RequestInit & { allow401?: boolean }
): Promise<T> {
  const { allow401, ...rest } = init ?? {};
  const r = await fetch(path, {
    credentials: "same-origin",
    cache: "no-store",
    ...rest,
    headers: { "Content-Type": "application/json", ...(rest?.headers ?? {}) },
  });
  if (r.status === 401 && !allow401) {
    notAuthorisedRedirect();
    throw new Error("Unauthorized");
  }
  if (!r.ok) {
    const j = (await r.json().catch(() => ({}))) as { error?: string };
    throw new Error(j.error ?? `HTTP ${r.status}`);
  }
  if (r.status === 204) return undefined as T;
  return (await r.json()) as T;
}

export async function fetchCampaigns(): Promise<{
  campaigns: Campaign[];
  cards: Campaign[];
}> {
  const j = await api<{ campaigns?: Campaign[]; cards?: Campaign[] }>(
    "/api/cashhunters"
  );
  return {
    campaigns: j.campaigns ?? [],
    cards: j.cards ?? [],
  };
}

export async function createCampaign(
  input: CampaignInput
): Promise<Campaign> {
  const j = await api<{ campaign: Campaign }>("/api/cashhunters", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return j.campaign;
}

export async function patchCampaign(
  id: string,
  patch: Partial<CampaignInput>
): Promise<void> {
  await api(`/api/cashhunters/${id}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
}

export async function deleteCampaign(id: string): Promise<void> {
  await api(`/api/cashhunters/${id}`, { method: "DELETE" });
}
