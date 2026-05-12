import type { Message } from "./types";

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
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
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

export async function fetchMessages(limit = 200): Promise<Message[]> {
  const json = await api<{ messages: Message[] }>(
    `/api/messages?limit=${limit}`
  );
  return json.messages;
}

export async function sendMessage(text: string): Promise<Message> {
  const json = await api<{ message: Message }>("/api/messages", {
    method: "POST",
    body: JSON.stringify({ text }),
  });
  return json.message;
}

export async function deleteMessage(id: string): Promise<void> {
  await api(`/api/messages/${id}`, { method: "DELETE" });
}
