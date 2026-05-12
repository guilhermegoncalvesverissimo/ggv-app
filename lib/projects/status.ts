import type { ProjectStatus } from "./types";

export const STATUS_LABEL: Record<ProjectStatus, string> = {
  active: "Em curso",
  idea: "Ideia",
  paused: "Pausado",
  done: "Concluído",
};

export const STATUS_COLOR: Record<ProjectStatus, string> = {
  active: "#22c55e", // success
  idea: "#f59e0b", // amber — "thinking" tone, distinct from active/paused/done
  paused: "#9ca3af", // muted-soft
  done: "#3b82f6", // blue
};

export const STATUS_ORDER: ProjectStatus[] = [
  "active",
  "idea",
  "paused",
  "done",
];
