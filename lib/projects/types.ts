export type ProjectStatus = "active" | "idea" | "paused" | "done";

export type Project = {
  id: string;
  name: string;
  description?: string;
  url?: string;
  tags: string[];
  status: ProjectStatus;
  emoji?: string;
  color: string;
  createdAt: number;
  updatedAt: number;
};

export const STORAGE_KEY = "ggv:projects:v1";
