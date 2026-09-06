import Link from "next/link";
import { ChevronLeft, Hammer } from "lucide-react";
import { SectionTitle } from "@/components/SectionCard";

export default function SalarioPage() {
  return (
    <div className="space-y-4 pt-1">
      <Link
        href="/finance"
        className="inline-flex items-center gap-1 text-sm font-medium text-muted transition hover:text-ink"
      >
        <ChevronLeft className="h-4 w-4" /> Wallet
      </Link>
      <SectionTitle>Salário</SectionTitle>

      <div className="card flex flex-col items-center gap-3 p-10 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-soft">
          <Hammer className="h-6 w-6 text-muted" />
        </div>
        <p className="text-sm font-medium">Em desenvolvimento</p>
        <p className="max-w-xs text-sm text-muted">
          Ainda não há nada aqui. Diz-me o que queres acompanhar do salário e eu
          construo.
        </p>
      </div>
    </div>
  );
}
