import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let cached: SupabaseClient | null = null;

/**
 * Server-side Supabase client using the service role key. Never bundle this
 * into client components — the service role bypasses Row Level Security.
 */
export function getSupabaseAdmin(): SupabaseClient | null {
  if (cached) return cached;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  cached = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}

export class StorageNotConfiguredError extends Error {
  constructor() {
    super(
      "Supabase env vars (SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY) are not set."
    );
  }
}
