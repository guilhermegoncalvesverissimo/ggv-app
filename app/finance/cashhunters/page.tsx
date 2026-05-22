import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { SectionTitle } from "@/components/SectionCard";
import { CashHuntersBoard } from "@/components/cashhunters/CashHuntersBoard";

export default function CashHuntersPage() {
  return (
    <div className="space-y-4 pt-1">
      <Link
        href="/finance"
        className="inline-flex items-center gap-1 text-sm font-medium text-muted transition hover:text-ink"
      >
        <ChevronLeft className="h-4 w-4" /> Wallet
      </Link>
      <SectionTitle>CashHunters</SectionTitle>
      <p className="-mt-2 text-sm text-ink/60">
        Campanhas de cashback que estás a perseguir. Toca numa campanha para
        editar passos e marcar como feitos.
      </p>

      <CashHuntersBoard />
    </div>
  );
}
