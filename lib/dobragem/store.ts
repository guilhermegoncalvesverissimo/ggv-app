import type { DubProject } from "./types";

/**
 * Dubbed videos live on this device: the projects (with their translated
 * lines) in localStorage, the video files themselves in IndexedDB.
 */
const KEY = "ggv:dobragem:v1";

export function listProjects(): DubProject[] {
  try {
    const raw = localStorage.getItem(KEY);
    const list = raw ? (JSON.parse(raw) as DubProject[]) : [];
    return Array.isArray(list) ? list.sort((a, b) => b.createdAt - a.createdAt) : [];
  } catch {
    return [];
  }
}

export function getProject(id: string): DubProject | null {
  return listProjects().find((p) => p.id === id) ?? null;
}

export function saveProject(p: DubProject): void {
  const rest = listProjects().filter((x) => x.id !== p.id);
  try {
    localStorage.setItem(KEY, JSON.stringify([p, ...rest]));
  } catch {
    throw new Error("Sem espaço no telemóvel para guardar este vídeo.");
  }
}

export async function deleteProject(id: string): Promise<void> {
  const p = getProject(id);
  try {
    localStorage.setItem(KEY, JSON.stringify(listProjects().filter((x) => x.id !== id)));
  } catch {
    /* ignore */
  }
  if (p?.fileKey) await deleteFile(p.fileKey).catch(() => {});
}

function db(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open("ggv-dobragem", 1);
    req.onupgradeneeded = () => req.result.createObjectStore("files");
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function tx<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const d = await db();
  return new Promise((resolve, reject) => {
    const r = fn(d.transaction("files", mode).objectStore("files"));
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
}

export const putFile = (key: string, file: Blob) => tx("readwrite", (s) => s.put(file, key));
export const getFile = (key: string) => tx<Blob | undefined>("readonly", (s) => s.get(key));
export const deleteFile = (key: string) => tx("readwrite", (s) => s.delete(key));
