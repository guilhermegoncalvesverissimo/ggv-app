import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/news/supabase";
import { eventColumns, type EventInput } from "@/lib/wallet/events";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const sb = getSupabaseAdmin();
  if (!sb) return NextResponse.json({ error: "Storage not configured" }, { status: 503 });
  let body: Partial<EventInput>;
  try {
    body = (await req.json()) as Partial<EventInput>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const cols = eventColumns(body);
  if ("name" in cols && !cols.name) return NextResponse.json({ error: "Empty name" }, { status: 400 });
  const { error } = await sb.from("ggv_wallet_events").update(cols).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

/** Deleting an event keeps its transactions (event_id → null). */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const sb = getSupabaseAdmin();
  if (!sb) return NextResponse.json({ error: "Storage not configured" }, { status: 503 });
  const { error } = await sb.from("ggv_wallet_events").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
