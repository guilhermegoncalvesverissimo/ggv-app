import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/news/supabase";
import { PHOTO_BUCKET } from "@/lib/viagens/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID = /^trips\/[0-9a-f-]{36}\/[a-z0-9_]+\.jpg$/i;

/**
 * Serves a photo from the private bucket. Behind the login like every other
 * route; paths are unique per upload, so the browser can cache them forever.
 */
export async function GET(req: Request) {
  const path = new URL(req.url).searchParams.get("p") ?? "";
  if (!VALID.test(path)) return NextResponse.json({ error: "Invalid path" }, { status: 400 });

  const sb = getSupabaseAdmin();
  if (!sb) return NextResponse.json({ error: "Storage not configured" }, { status: 503 });

  const { data, error } = await sb.storage.from(PHOTO_BUCKET).download(path);
  if (error || !data) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return new NextResponse(data, {
    headers: {
      "Content-Type": "image/jpeg",
      "Cache-Control": "private, max-age=31536000, immutable",
    },
  });
}
