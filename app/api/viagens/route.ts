import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/news/supabase";
import type { TripInput } from "@/lib/viagens/types";
import { type Row, tableMissing, toColumns, toTrip } from "@/lib/viagens/rows";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const sb = getSupabaseAdmin();
  if (!sb) return NextResponse.json({ error: "Storage not configured" }, { status: 503 });

  const { data, error } = await sb
    .from("ggv_trips")
    .select("*")
    .order("start_date", { ascending: true, nullsFirst: false });

  if (tableMissing(error?.message)) {
    return NextResponse.json({ trips: [], note: "storage_not_configured" });
  }
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ trips: ((data ?? []) as Row[]).map(toTrip) });
}

export async function POST(req: Request) {
  const sb = getSupabaseAdmin();
  if (!sb) return NextResponse.json({ error: "Storage not configured" }, { status: 503 });

  let body: Partial<TripInput>;
  try {
    body = (await req.json()) as Partial<TripInput>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const cols = toColumns(body);
  if (!cols.name || !cols.color) {
    return NextResponse.json({ error: "Missing or invalid fields" }, { status: 400 });
  }

  const { data, error } = await sb.from("ggv_trips").insert(cols).select().single();
  if (tableMissing(error?.message)) {
    return NextResponse.json(
      { error: "Falta criar a tabela ggv_trips (supabase/0010_trips.sql)" },
      { status: 503 }
    );
  }
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ trip: toTrip(data as Row) }, { status: 201 });
}
