import { SectionTitle } from "@/components/SectionCard";
import { Wallet, TrendingUp, TrendingDown } from "lucide-react";


export default function FinancePage() {
  return (
    <div className="space-y-4 pt-1">
      <SectionTitle>Wallet</SectionTitle>

      <section className="card p-6">
        <div className="flex items-center gap-3 text-xs uppercase tracking-wide text-muted">
          <Wallet className="h-4 w-4" />
          Saldo combinado
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-4xl font-semibold tracking-tight">€0,00</span>
          <span className="text-sm text-muted">este mês</span>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-canvas-soft/40 p-4">
            <div className="flex items-center gap-1.5 text-xs text-success">
              <TrendingUp className="h-3.5 w-3.5" /> Entradas
            </div>
            <div className="mt-1 text-lg font-semibold">€0</div>
          </div>
          <div className="rounded-2xl bg-canvas-soft/40 p-4">
            <div className="flex items-center gap-1.5 text-xs text-danger">
              <TrendingDown className="h-3.5 w-3.5" /> Saídas
            </div>
            <div className="mt-1 text-lg font-semibold">€0</div>
          </div>
        </div>
      </section>

      <section className="card p-5">
        <h2 className="text-sm font-semibold tracking-tight">
          Últimas transações
        </h2>
        <p className="mt-2 text-sm text-muted">
          Nada por aqui ainda. Adiciona contas (pessoais ou das empresas) para
          começar a ver o agregado.
        </p>
      </section>
    </div>
  );
}
