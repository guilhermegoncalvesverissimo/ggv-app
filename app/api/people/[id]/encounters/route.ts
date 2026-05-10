import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/news/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** POST adds a new encounter; an optional `at` body field overrides "now"
 *  (useful for the one-shot localStorage → Supabase migration). */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const sb = getSupabaseAdmin();
  if (!sb) {
    return NextResponse.json(
      { error: "Storage not configured" },
      { status: 503 }
    );
  }

  let at: string | null = null;
  try {
    const body = (await req.json().catch(() => ({}))) as { at?: number };
    if (typeof body.at === "number" && Number.isFinite(body.at)) {
      at = new Date(body.at).toISOString();
    }
  } catch {
    /* allow empty body */
  }

  const { data, error } = await sb
    .from("encounters")
    .insert({ person_id: id, ...(at ? { at } : {}) })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(
    {
      encounter: {
        id: (data as { id: string }).id,
        at: new Date((data as { at: string }).at).getTime(),
      },
    },
    { status: 201 }
  );
}

/** DELETE removes a specific encounter by id (passed as `?encounterId=`). */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const url = new URL(req.url);
  const encounterId = url.searchParams.get("encounterId");
  if (!encounterId) {
    return NextResponse.json(
      { error: "Missing ?encounterId" },
      { status: 400 }
    );
  }
  const sb = getSupabaseAdmin();
  if (!sb) {
    return NextResponse.json(
      { error: "Storage not configured" },
      { status: 503 }
    );
  }
  const { error } = await sb
    .from("encounters")
    .delete()
    .eq("id", encounterId)
    .eq("person_id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
