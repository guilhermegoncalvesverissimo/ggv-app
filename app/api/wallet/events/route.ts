import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/news/supabase";
import { eventColumns, toWalletEvent, type EventInput } from "@/lib/wallet/events";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const sb = getSupabaseAdmin();
  if (!sb) return NextResponse.json({ error: "Storage not configured" }, { status: 503 });
  let body: Partial<EventInput>;
  try {
    body = (await req.json()) as Partial<EventInput>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const cols = eventColumns(body);
  if (!cols.name || !cols.color) {
    return NextResponse.json({ error: "Missing or invalid fields" }, { status: 400 });
  }
  const { data, error } = await sb.from("ggv_wallet_events").insert(cols).select().single();
  if (error) {
    const missing = /could not find the table|does not exist/i.test(error.message);
    return NextResponse.json(
      { error: missing ? "Falta criar os eventos na base de dados (supabase/0012_wallet_events.sql)" : error.message },
      { status: missing ? 503 : 500 }
    );
  }
  return NextResponse.json({ event: toWalletEvent(data) }, { status: 201 });
}
