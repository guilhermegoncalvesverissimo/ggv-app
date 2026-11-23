import { getSupabaseAdmin } from "@/lib/news/supabase";
import { categoryById } from "@/lib/wallet/categories";
import { formatCents } from "@/lib/wallet/format";
import {
  checkApplePayToken,
  guessCategory,
  parseAmount,
  todayLisbon,
} from "@/lib/wallet/applePay";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Called by the iOS Shortcuts "Transaction" automation on every Apple Pay
 * payment. Public in proxy.ts (Shortcuts has no session cookie); guarded by
 * the bearer token instead. Replies in plain text so the Shortcut can show
 * the answer straight in a notification.
 *
 * Body (JSON or form): { amount, merchant, card? }
 */
function text(body: string, status = 200) {
  return new Response(body, {
    status,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}

async function readBody(req: Request): Promise<Record<string, unknown>> {
  const type = req.headers.get("content-type") ?? "";
  try {
    if (type.includes("application/json")) return (await req.json()) as Record<string, unknown>;
    if (type.includes("form")) return Object.fromEntries((await req.formData()).entries());
    const raw = await req.text();
    try {
      return JSON.parse(raw) as Record<string, unknown>;
    } catch {
      return Object.fromEntries(new URLSearchParams(raw).entries());
    }
  } catch {
    return {};
  }
}

const str = (v: unknown) => (typeof v === "string" ? v.trim() : typeof v === "number" ? String(v) : "");

export async function POST(req: Request) {
  if (!checkApplePayToken(req.headers.get("authorization"))) {
    return text("Código do atalho inválido.", 401);
  }
  const sb = getSupabaseAdmin();
  if (!sb) return text("Base de dados não configurada.", 503);

  const body = await readBody(req);
  const cents = parseAmount(body.amount);
  if (cents === null || cents === 0) return text("Montante em falta ou inválido.", 400);
  const merchant = str(body.merchant) || "Apple Pay";
  const card = str(body.card).toLowerCase();

  const { data: accounts, error: accErr } = await sb
    .from("ggv_accounts")
    .select("id, name")
    .order("created_at", { ascending: true });
  if (accErr) return text(accErr.message, 500);
  if (!accounts?.length) return text("Cria primeiro uma conta na Wallet.", 400);

  // Card "Revolut" → account named "Revolut" (either way round); else the
  // first account.
  const account =
    (card &&
      accounts.find((a) => {
        const name = String(a.name).toLowerCase();
        return name.includes(card) || card.includes(name);
      })) ||
    accounts[0];

  // A negative amount is a refund coming back to the card.
  const isRefund = cents < 0;
  const category = isRefund ? "refund" : guessCategory(merchant);
  const amountCents = Math.abs(cents);

  const { error } = await sb.from("ggv_transactions").insert({
    account_id: account.id,
    type: isRefund ? "income" : "expense",
    amount_cents: amountCents,
    category,
    note: merchant,
    date: todayLisbon(),
  });
  if (error) return text(error.message, 500);

  const label = categoryById(category)?.label ?? category;
  return text(
    `${isRefund ? "Reembolso" : "Despesa"} registada: ${formatCents(amountCents)} · ${merchant} (${label}, ${account.name})`,
    201
  );
}

/** Opening the URL in a browser: a quick "is it reachable?" check. */
export async function GET() {
  return text("OK — o endereço do atalho Apple Pay está a funcionar. O atalho tem de usar o método POST.");
}
