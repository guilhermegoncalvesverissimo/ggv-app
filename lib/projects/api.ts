import type { Project } from "./types";
import type { ProjectInput } from "./useProjects";

/** Typed wrappers around /api/projects*. Session-cookie auth; 401 → /login. */

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

export async function fetchProjects(): Promise<Project[]> {
  const j = await api<{ projects: Project[] }>("/api/projects");
  return j.projects;
}

export async function createProject(
  input: ProjectInput & { createdAt?: number }
): Promise<Project> {
  const j = await api<{ project: Project }>("/api/projects", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return j.project;
}

export async function patchProject(
  id: string,
  patch: Partial<ProjectInput>
): Promise<void> {
  await api(`/api/projects/${id}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
}

export async function deleteProject(id: string): Promise<void> {
  await api(`/api/projects/${id}`, { method: "DELETE" });
}
