import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/news/supabase";
import type { Account } from "@/lib/wallet/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const sb = getSupabaseAdmin();
  if (!sb) {
    return NextResponse.json(
      { error: "Storage not configured" },
      { status: 503 }
    );
  }

  let body: {
    name?: string;
    color?: string;
    emoji?: string;
    createdAt?: number;
  };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const name = (body.name ?? "").trim();
  const color = (body.color ?? "").trim();
  if (!name || !color) {
    return NextResponse.json(
      { error: "Missing name or color" },
      { status: 400 }
    );
  }

  const { data, error } = await sb
    .from("ggv_accounts")
    .insert({
      name,
      color,
      emoji: body.emoji?.trim() || null,
      ...(body.createdAt
        ? { created_at: new Date(body.createdAt).toISOString() }
        : {}),
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const account: Account = {
    id: data.id,
    name: data.name,
    color: data.color,
    emoji: data.emoji ?? undefined,
    createdAt: new Date(data.created_at).getTime(),
  };
  return NextResponse.json({ account }, { status: 201 });
}
