import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/news/supabase";
import type { Category } from "@/lib/wallet/categories";

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

  let body: { label?: string; emoji?: string; type?: "income" | "expense" };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const label = (body.label ?? "").trim();
  const emoji = (body.emoji ?? "").trim();
  const type = body.type;
  if (!label || !emoji || (type !== "income" && type !== "expense")) {
    return NextResponse.json(
      { error: "Missing or invalid fields" },
      { status: 400 }
    );
  }

  const { data, error } = await sb
    .from("ggv_categories")
    .insert({ label, emoji, type })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const category: Category = {
    id: data.id,
    label: data.label,
    emoji: data.emoji,
    type: data.type,
    custom: true,
  };
  return NextResponse.json({ category }, { status: 201 });
}
