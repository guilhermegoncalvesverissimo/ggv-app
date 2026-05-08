import { SectionTitle } from "@/components/SectionCard";
import { Users } from "lucide-react";


export default function NetworkingPage() {
  return (
    <div className="space-y-4 pt-1">
      <SectionTitle>Networking</SectionTitle>
      <p className="-mt-2 text-sm text-ink/60">
        Cada bolha é uma pessoa. Mantém pressionada para registar mais um
        encontro — quanto mais vezes te vês, maior fica a bolha.
      </p>

      <div className="card flex flex-col items-center gap-3 p-8 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-soft">
          <Users className="h-6 w-6 text-accent" strokeWidth={2.25} />
        </div>
        <h2 className="text-lg font-semibold tracking-tight">
          Ainda sem pessoas
        </h2>
        <p className="max-w-xs text-sm text-muted">
          Adiciona o teu primeiro contacto e começa a contar encontros com um
          long-press na bolha.
        </p>
        <button className="mt-2 rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-white transition active:scale-95">
          Adicionar pessoa
        </button>
      </div>
    </div>
  );
}
