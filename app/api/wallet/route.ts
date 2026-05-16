import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/news/supabase";
import type { Account, Transaction } from "@/lib/wallet/types";
import type { Category } from "@/lib/wallet/categories";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type AccountRow = {
  id: string;
  name: string;
  color: string;
  emoji: string | null;
  created_at: string;
};
type TxRow = {
  id: string;
  account_id: string;
  type: "income" | "expense";
  amount_cents: number;
  category: string;
  note: string | null;
  date: string;
  created_at: string;
};
type CategoryRow = {
  id: string;
  label: string;
  emoji: string;
  type: "income" | "expense";
};

function toAccount(r: AccountRow): Account {
  return {
    id: r.id,
    name: r.name,
    color: r.color,
    emoji: r.emoji ?? undefined,
    createdAt: new Date(r.created_at).getTime(),
  };
}
function toTx(r: TxRow): Transaction {
  return {
    id: r.id,
    accountId: r.account_id,
    type: r.type,
    amountCents: r.amount_cents,
    category: r.category,
    note: r.note ?? undefined,
    date: r.date,
    createdAt: new Date(r.created_at).getTime(),
  };
}
function toCategory(r: CategoryRow): Category {
  return {
    id: r.id,
    label: r.label,
    emoji: r.emoji,
    type: r.type,
    custom: true,
  };
}

const tableMissing = (msg?: string) =>
  !!msg && /could not find the table|does not exist/i.test(msg);

export async function GET() {
  const sb = getSupabaseAdmin();
  if (!sb) {
    return NextResponse.json(
      { error: "Storage not configured" },
      { status: 503 }
    );
  }
  const [
    { data: acc, error: aErr },
    { data: tx, error: tErr },
    { data: cats, error: cErr },
  ] = await Promise.all([
    sb
      .from("ggv_accounts")
      .select("*")
      .order("created_at", { ascending: true }),
    sb.from("ggv_transactions").select("*"),
    sb
      .from("ggv_categories")
      .select("*")
      .order("created_at", { ascending: true }),
  ]);

  // Accounts/transactions tables missing → degrade gracefully.
  if (tableMissing(aErr?.message) || tableMissing(tErr?.message)) {
    return NextResponse.json({
      accounts: [],
      transactions: [],
      categories: [],
      note: "storage_not_configured",
    });
  }
  if (aErr) return NextResponse.json({ error: aErr.message }, { status: 500 });
  if (tErr) return NextResponse.json({ error: tErr.message }, { status: 500 });

  // ggv_categories is independent — if just that table is missing, return the
  // rest and an empty categories list (built-ins still work client-side).
  const categories = tableMissing(cErr?.message)
    ? []
    : ((cats ?? []) as CategoryRow[]).map(toCategory);

  return NextResponse.json({
    accounts: ((acc ?? []) as AccountRow[]).map(toAccount),
    transactions: ((tx ?? []) as TxRow[]).map(toTx),
    categories,
  });
}
