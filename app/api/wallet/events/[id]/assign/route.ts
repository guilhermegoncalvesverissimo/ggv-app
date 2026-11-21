import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/news/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Bulk add/remove transactions to/from an event: { add: ids, remove: ids }. */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const sb = getSupabaseAdmin();
  if (!sb) return NextResponse.json({ error: "Storage not configured" }, { status: 503 });
  let body: { add?: unknown; remove?: unknown };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const ids = (v: unknown) =>
    Array.isArray(v) ? v.filter((x): x is string => typeof x === "string" && !x.startsWith("temp_")) : [];
  const add = ids(body.add);
  const remove = ids(body.remove);

  if (add.length) {
    const { error } = await sb.from("ggv_transactions").update({ event_id: id }).in("id", add);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (remove.length) {
    const { error } = await sb
      .from("ggv_transactions")
      .update({ event_id: null })
      .in("id", remove)
      .eq("event_id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
