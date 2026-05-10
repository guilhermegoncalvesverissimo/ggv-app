import {
  getSupabaseAdmin,
  StorageNotConfiguredError,
} from "./supabase";
import type { NewsPost, NewsPostInput } from "./types";

const TABLE = "news_posts";

/** Fetch the most recent posts, newest first. */
export async function listPosts(limit = 50): Promise<NewsPost[]> {
  const sb = getSupabaseAdmin();
  if (!sb) throw new StorageNotConfiguredError();

  const { data, error } = await sb
    .from(TABLE)
    .select("*")
    .order("posted_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  return (data ?? []).map(rowToPost);
}

/** Insert a new post; idempotent on (source, posted_at) so the routine can
 *  safely re-run without producing duplicates. */
export async function addPost(input: NewsPostInput): Promise<NewsPost> {
  const sb = getSupabaseAdmin();
  if (!sb) throw new StorageNotConfiguredError();

  const { data, error } = await sb
    .from(TABLE)
    .upsert(
      {
        source: input.source,
        author: input.author ?? null,
        original_text: input.originalText,
        translation: input.translation,
        posted_at: input.postedAt,
      },
      { onConflict: "source", ignoreDuplicates: false }
    )
    .select()
    .single();

  if (error) throw new Error(error.message);
  return rowToPost(data);
}

type Row = {
  id: string;
  source: string;
  author: string | null;
  original_text: string;
  translation: string;
  posted_at: string;
  saved_at: string;
};

function rowToPost(r: Row): NewsPost {
  return {
    id: r.id,
    source: r.source,
    author: r.author ?? undefined,
    originalText: r.original_text,
    translation: r.translation,
    postedAt: r.posted_at,
    savedAt: r.saved_at,
  };
}
