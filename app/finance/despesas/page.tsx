import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { SectionTitle } from "@/components/SectionCard";
import { ExpensesBoard } from "@/components/wallet/ExpensesBoard";

export default function DespesasPage() {
  return (
    <div className="space-y-4 pt-1">
      <Link
        href="/finance"
        className="inline-flex items-center gap-1 text-sm font-medium text-muted transition hover:text-ink"
      >
        <ChevronLeft className="h-4 w-4" /> Wallet
      </Link>
      <SectionTitle>Despesas</SectionTitle>
      <p className="-mt-2 text-sm text-ink/60">
        Para onde vai o dinheiro. Toca numa categoria para ver as transações.
      </p>

      <ExpensesBoard />
    </div>
  );
}
