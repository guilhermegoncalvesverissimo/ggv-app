export type TripItemKind =
  | "voo"
  | "alojamento"
  | "transporte"
  | "atividade"
  | "comida"
  | "outro";

export type TripItem = {
  id: string;
  kind: TripItemKind;
  title: string;
  /** YYYY-MM-DD; sem data fica em "Por agendar". */
  date?: string;
  /** HH:MM */
  time?: string;
  place?: string;
  link?: string;
  notes?: string;
  costCents?: number;
};

export type ChecklistItem = {
  id: string;
  text: string;
  done: boolean;
};

export type TripPhoto = {
  id: string;
  /** Storage paths in the ggv-trips bucket. */
  path: string;
  thumbPath: string;
  width: number;
  height: number;
  createdAt: number;
};

export type Trip = {
  id: string;
  name: string;
  destination?: string;
  emoji?: string;
  color: string;
  startDate?: string;
  endDate?: string;
  budgetCents?: number;
  notes?: string;
  items: TripItem[];
  checklist: ChecklistItem[];
  /** Managed by the photo routes, never sent in a PATCH. */
  photos: TripPhoto[];
  createdAt: number;
  updatedAt: number;
};

export type TripInput = Omit<Trip, "id" | "createdAt" | "updatedAt" | "photos">;

export const KIND_META: Record<TripItemKind, { label: string; emoji: string }> = {
  voo: { label: "Voo", emoji: "✈️" },
  alojamento: { label: "Alojamento", emoji: "🏨" },
  transporte: { label: "Transporte", emoji: "🚆" },
  atividade: { label: "Atividade", emoji: "🎟️" },
  comida: { label: "Comida", emoji: "🍽️" },
  outro: { label: "Outro", emoji: "📌" },
};

export const KIND_ORDER: TripItemKind[] = [
  "voo",
  "alojamento",
  "transporte",
  "atividade",
  "comida",
  "outro",
];

export function localId(prefix = "i"): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export const PHOTO_BUCKET = "ggv-trips";

/** URL the app serves a stored photo from (auth-gated, cached). */
export function photoUrl(path: string): string {
  return `/api/viagens/fotos?p=${encodeURIComponent(path)}`;
}
