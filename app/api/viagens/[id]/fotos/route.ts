import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/news/supabase";
import { PHOTO_BUCKET, localId, type TripPhoto } from "@/lib/viagens/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BYTES = 4 * 1024 * 1024;

/** Upload one photo (full + thumb, already compressed by the client). */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const sb = getSupabaseAdmin();
  if (!sb) return NextResponse.json({ error: "Storage not configured" }, { status: 503 });

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form" }, { status: 400 });
  }
  const full = form.get("full");
  const thumb = form.get("thumb");
  if (!(full instanceof Blob) || !(thumb instanceof Blob)) {
    return NextResponse.json({ error: "Missing files" }, { status: 400 });
  }
  if (full.size > MAX_BYTES || thumb.size > MAX_BYTES) {
    return NextResponse.json({ error: "Foto demasiado grande" }, { status: 413 });
  }

  const { data: trip, error: readErr } = await sb
    .from("ggv_trips")
    .select("photos")
    .eq("id", id)
    .single();
  if (readErr || !trip) {
    const missingColumn = /photos/i.test(readErr?.message ?? "");
    return NextResponse.json(
      {
        error: missingColumn
          ? "Falta preparar as fotos na base de dados (supabase/0011_trip_photos.sql)"
          : "Viagem não encontrada",
      },
      { status: missingColumn ? 503 : 404 }
    );
  }

  const photoId = localId("f");
  const base = `trips/${id}/${photoId}`;
  const opts = { contentType: "image/jpeg", upsert: false };
  const up1 = await sb.storage.from(PHOTO_BUCKET).upload(`${base}.jpg`, full, opts);
  const up2 = up1.error
    ? null
    : await sb.storage.from(PHOTO_BUCKET).upload(`${base}_t.jpg`, thumb, opts);
  const upErr = up1.error ?? up2?.error;
  if (upErr) {
    await sb.storage.from(PHOTO_BUCKET).remove([`${base}.jpg`]);
    const noBucket = /bucket not found/i.test(upErr.message);
    return NextResponse.json(
      {
        error: noBucket
          ? "Falta criar o bucket ggv-trips (supabase/0011_trip_photos.sql)"
          : upErr.message,
      },
      { status: noBucket ? 503 : 500 }
    );
  }

  const photo: TripPhoto = {
    id: photoId,
    path: `${base}.jpg`,
    thumbPath: `${base}_t.jpg`,
    width: Number(form.get("width")) || 0,
    height: Number(form.get("height")) || 0,
    createdAt: Date.now(),
  };
  const photos = [...((trip.photos as TripPhoto[] | null) ?? []), photo];
  const { error } = await sb
    .from("ggv_trips")
    .update({ photos, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) {
    await sb.storage.from(PHOTO_BUCKET).remove([photo.path, photo.thumbPath]);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ photo }, { status: 201 });
}
