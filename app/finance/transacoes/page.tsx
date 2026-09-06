import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { SectionTitle } from "@/components/SectionCard";
import { TransactionsBoard } from "@/components/wallet/TransactionsBoard";

export default function TransacoesPage() {
  return (
    <div className="space-y-4 pt-1">
      <Link
        href="/finance"
        className="inline-flex items-center gap-1 text-sm font-medium text-muted transition hover:text-ink"
      >
        <ChevronLeft className="h-4 w-4" /> Wallet
      </Link>
      <SectionTitle>Transações</SectionTitle>

      <TransactionsBoard />
    </div>
  );
}
