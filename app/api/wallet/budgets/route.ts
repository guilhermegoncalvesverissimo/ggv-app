import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/news/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Upsert a category's monthly budget. amountCents <= 0 deletes it. */
export async function PUT(req: Request) {
  const sb = getSupabaseAdmin();
  if (!sb) {
    return NextResponse.json(
      { error: "Storage not configured" },
      { status: 503 }
    );
  }

  let body: { category?: string; amountCents?: number };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const category = (body.category ?? "").trim();
  const amountCents = Math.round(Number(body.amountCents));
  if (!category || !Number.isFinite(amountCents)) {
    return NextResponse.json(
      { error: "Missing or invalid fields" },
      { status: 400 }
    );
  }

  if (amountCents <= 0) {
    const { error } = await sb
      .from("ggv_budgets")
      .delete()
      .eq("category", category);
    if (error)
      return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, removed: true });
  }

  const { error } = await sb
    .from("ggv_budgets")
    .upsert(
      { category, amount_cents: amountCents, updated_at: new Date().toISOString() },
      { onConflict: "category" }
    );
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const sb = getSupabaseAdmin();
  if (!sb) {
    return NextResponse.json(
      { error: "Storage not configured" },
      { status: 503 }
    );
  }
  const category = new URL(req.url).searchParams.get("category");
  if (!category) {
    return NextResponse.json({ error: "Missing ?category" }, { status: 400 });
  }
  const { error } = await sb
    .from("ggv_budgets")
    .delete()
    .eq("category", category);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
