/** One line of speech: English source, Portuguese translation, timing in seconds. */
export type Segment = { start: number; end: number; en: string; pt?: string };

export type DubProject = {
  id: string;
  kind: "youtube" | "file";
  title: string;
  youtubeId?: string;
  /** IndexedDB key of the stored video file (kind "file"). */
  fileKey?: string;
  fileName?: string;
  segments: Segment[];
  createdAt: number;
};
