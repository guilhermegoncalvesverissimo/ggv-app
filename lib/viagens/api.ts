import type { Trip, TripInput } from "./types";

/** Typed wrappers around /api/viagens*. Session-cookie auth; 401 → /login. */

function notAuthorisedRedirect() {
  if (typeof window === "undefined") return;
  const next = window.location.pathname + window.location.search;
  window.location.href = `/login?next=${encodeURIComponent(next)}`;
}

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const r = await fetch(path, {
    credentials: "same-origin",
    cache: "no-store",
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  if (r.status === 401) {
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

export async function fetchTrips(): Promise<Trip[]> {
  const j = await api<{ trips: Trip[] }>("/api/viagens");
  return j.trips;
}

export async function createTrip(input: TripInput): Promise<Trip> {
  const j = await api<{ trip: Trip }>("/api/viagens", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return j.trip;
}

export async function patchTrip(id: string, patch: Partial<TripInput>): Promise<void> {
  await api(`/api/viagens/${id}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
}

export async function deleteTrip(id: string): Promise<void> {
  await api(`/api/viagens/${id}`, { method: "DELETE" });
}
