import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/news/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(
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

  let body: {
    accountId?: string;
    type?: "income" | "expense";
    amountCents?: number;
    category?: string;
    note?: string;
    date?: string;
  };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const patch: Record<string, unknown> = {};
  if (typeof body.accountId === "string" && body.accountId)
    patch.account_id = body.accountId;
  if (body.type === "income" || body.type === "expense")
    patch.type = body.type;
  if (
    typeof body.amountCents === "number" &&
    Number.isFinite(body.amountCents) &&
    body.amountCents >= 0
  )
    patch.amount_cents = Math.round(body.amountCents);
  if (typeof body.category === "string" && body.category)
    patch.category = body.category;
  if ("note" in body) patch.note = body.note?.trim() || null;
  if (typeof body.date === "string" && body.date) patch.date = body.date;

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const { error } = await sb
    .from("ggv_transactions")
    .update(patch)
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
  if (!sb) {
    return NextResponse.json(
      { error: "Storage not configured" },
      { status: 503 }
    );
  }
  const { error } = await sb.from("ggv_transactions").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
