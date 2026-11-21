import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/news/supabase";
import type { TripInput } from "@/lib/viagens/types";
import { toColumns } from "@/lib/viagens/rows";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const sb = getSupabaseAdmin();
  if (!sb) return NextResponse.json({ error: "Storage not configured" }, { status: 503 });

  let body: Partial<TripInput>;
  try {
    body = (await req.json()) as Partial<TripInput>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const cols = toColumns(body);
  if ("name" in cols && !cols.name) {
    return NextResponse.json({ error: "Empty name" }, { status: 400 });
  }

  const { error } = await sb
    .from("ggv_trips")
    .update({ ...cols, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const sb = getSupabaseAdmin();
  if (!sb) return NextResponse.json({ error: "Storage not configured" }, { status: 503 });
  const { error } = await sb.from("ggv_trips").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
