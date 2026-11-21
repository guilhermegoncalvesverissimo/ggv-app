import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/news/supabase";
import { PHOTO_BUCKET, type TripPhoto } from "@/lib/viagens/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; photoId: string }> }
) {
  const { id, photoId } = await params;
  const sb = getSupabaseAdmin();
  if (!sb) return NextResponse.json({ error: "Storage not configured" }, { status: 503 });

  const { data: trip, error: readErr } = await sb
    .from("ggv_trips")
    .select("photos")
    .eq("id", id)
    .single();
  if (readErr || !trip) return NextResponse.json({ error: "Viagem não encontrada" }, { status: 404 });

  const all = (trip.photos as TripPhoto[] | null) ?? [];
  const target = all.find((p) => p.id === photoId);
  if (!target) return NextResponse.json({ ok: true });

  const { error } = await sb
    .from("ggv_trips")
    .update({ photos: all.filter((p) => p.id !== photoId), updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Best effort: a leftover file is harmless, a dangling entry isn't.
  await sb.storage.from(PHOTO_BUCKET).remove([target.path, target.thumbPath]);
  return NextResponse.json({ ok: true });
}
