import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/news/supabase";
import type { Transaction } from "@/lib/wallet/types";

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
    accountId?: string;
    type?: "income" | "expense";
    amountCents?: number;
    category?: string;
    note?: string;
    date?: string;
    createdAt?: number;
  };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (
    !body.accountId ||
    (body.type !== "income" && body.type !== "expense") ||
    typeof body.amountCents !== "number" ||
    !Number.isFinite(body.amountCents) ||
    body.amountCents < 0 ||
    !body.category ||
    !body.date
  ) {
    return NextResponse.json(
      { error: "Missing or invalid fields" },
      { status: 400 }
    );
  }

  const { data, error } = await sb
    .from("ggv_transactions")
    .insert({
      account_id: body.accountId,
      type: body.type,
      amount_cents: Math.round(body.amountCents),
      category: body.category,
      note: body.note?.trim() || null,
      date: body.date,
      ...(body.createdAt
        ? { created_at: new Date(body.createdAt).toISOString() }
        : {}),
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const transaction: Transaction = {
    id: data.id,
    accountId: data.account_id,
    type: data.type,
    amountCents: data.amount_cents,
    category: data.category,
    note: data.note ?? undefined,
    date: data.date,
    createdAt: new Date(data.created_at).getTime(),
  };
  return NextResponse.json({ transaction }, { status: 201 });
}
