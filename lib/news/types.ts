export type NewsPost = {
  id: string;
  /** URL of the original post (e.g. an x.com link). */
  source: string;
  /** Optional author handle, e.g. "@bcherny". */
  author?: string;
  /** Original (untranslated) post text. */
  originalText: string;
  /** Translation into European Portuguese. */
  translation: string;
  /** When the original was posted (ISO 8601). */
  postedAt: string;
  /** When this row was saved into our DB. */
  savedAt: string;
};

export type NewsPostInput = Omit<NewsPost, "id" | "savedAt">;
