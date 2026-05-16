import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { SectionTitle } from "@/components/SectionCard";
import { BudgetsBoard } from "@/components/wallet/BudgetsBoard";

export default function BudgetsPage() {
  return (
    <div className="space-y-4 pt-1">
      <Link
        href="/finance"
        className="inline-flex items-center gap-1 text-sm font-medium text-muted transition hover:text-ink"
      >
        <ChevronLeft className="h-4 w-4" /> Wallet
      </Link>
      <SectionTitle>Budgets</SectionTitle>
      <p className="-mt-2 text-sm text-ink/60">
        Limite mensal por categoria. A barra mostra quanto já gastaste no mês
        escolhido.
      </p>

      <BudgetsBoard />
    </div>
  );
}
