import { NextResponse } from "next/server";
import { applePayToken } from "@/lib/wallet/applePay";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Session-protected: hands the Shortcut token to the setup screen. */
export async function GET(req: Request) {
  const token = applePayToken();
  if (!token) return NextResponse.json({ error: "APP_SECRET em falta" }, { status: 503 });
  const origin = new URL(req.url).origin;
  return NextResponse.json({ token, url: `${origin}/api/hooks/apple-pay` });
}
