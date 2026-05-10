import type { Person } from "./types";

/** Tiny typed wrappers around the /api/people endpoints. All requests are
 *  same-origin and rely on the session cookie set by /api/auth/login.
 *  On 401 we bounce the user to /login (preserving where they came from). */

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
    headers: {
      "Content-Type": "application/json",
      ...(rest?.headers ?? {}),
    },
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

export async function fetchPeople(): Promise<Person[]> {
  const json = await api<{ people: Person[] }>("/api/people");
  return json.people;
}

export async function createPerson(input: {
  name: string;
  badge?: string;
  avatar?: string;
}): Promise<Person> {
  const json = await api<{ person: Person }>("/api/people", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return json.person;
}

export async function patchPerson(
  id: string,
  patch: { name?: string; badge?: string; avatar?: string | null }
): Promise<void> {
  await api(`/api/people/${id}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
}

export async function deletePerson(id: string): Promise<void> {
  await api(`/api/people/${id}`, { method: "DELETE" });
}

export async function logEncounter(
  personId: string,
  at?: number
): Promise<{ id: string; at: number }> {
  const json = await api<{ encounter: { id: string; at: number } }>(
    `/api/people/${personId}/encounters`,
    {
      method: "POST",
      body: JSON.stringify(at !== undefined ? { at } : {}),
    }
  );
  return json.encounter;
}

export async function deleteEncounter(
  personId: string,
  encounterId: string
): Promise<void> {
  await api(
    `/api/people/${personId}/encounters?encounterId=${encodeURIComponent(
      encounterId
    )}`,
    { method: "DELETE" }
  );
}
