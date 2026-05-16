import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/news/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
  // Transactions keep their category id string; if a custom category is
  // deleted, those rows fall back to the "❓ Outras" rendering. No cascade.
  const { error } = await sb.from("ggv_categories").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
