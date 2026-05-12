import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/news/supabase";
import type { Message } from "@/lib/messages/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Row = { id: string; text: string; created_at: string };

const rowToMessage = (r: Row): Message => ({
  id: r.id,
  text: r.text,
  createdAt: new Date(r.created_at).getTime(),
});

const MAX_LEN = 4000;

export async function GET(req: Request) {
  const sb = getSupabaseAdmin();
  if (!sb) {
    return NextResponse.json({ error: "Storage not configured" }, { status: 503 });
  }

  const url = new URL(req.url);
  const limit = Math.min(Number(url.searchParams.get("limit") ?? 200) || 200, 1000);
  const since = url.searchParams.get("since"); // optional ISO ts

  let q = sb
    .from("messages")
    .select("*")
    .order("created_at", { ascending: true })
    .limit(limit);
  if (since) {
    q = q.gt("created_at", since);
  }

  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({
    messages: (data ?? []).map((r) => rowToMessage(r as Row)),
  });
}

export async function POST(req: Request) {
  const sb = getSupabaseAdmin();
  if (!sb) {
    return NextResponse.json({ error: "Storage not configured" }, { status: 503 });
  }

  let body: { text?: string };
  try {
    body = (await req.json()) as { text?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const text = (body.text ?? "").trim();
  if (!text) return NextResponse.json({ error: "Empty text" }, { status: 400 });
  if (text.length > MAX_LEN) {
    return NextResponse.json(
      { error: `Text too long (max ${MAX_LEN} chars)` },
      { status: 400 }
    );
  }

  const { data, error } = await sb
    .from("messages")
    .insert({ text })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(
    { message: rowToMessage(data as Row) },
    { status: 201 }
  );
}
