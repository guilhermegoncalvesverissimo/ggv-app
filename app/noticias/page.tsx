import { SectionTitle } from "@/components/SectionCard";
import { Sparkles } from "lucide-react";


export default function NoticiasPage() {
  return (
    <div className="space-y-4 pt-1">
      <SectionTitle>Notícias</SectionTitle>
      <p className="-mt-2 text-sm text-ink/60">
        Feed dos posts do Boris Cherny, traduzidos para português.
      </p>

      <div className="card flex flex-col items-center gap-3 p-8 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-soft">
          <Sparkles className="h-6 w-6 text-accent" strokeWidth={2.25} />
        </div>
        <h2 className="text-lg font-semibold tracking-tight">
          Sem posts ainda
        </h2>
        <p className="max-w-xs text-sm text-muted">
          A routine que vai buscar e traduzir os tweets ainda não foi criada.
          Assim que ligares o connector, os posts mais recentes aparecem aqui.
        </p>
      </div>
    </div>
  );
}
