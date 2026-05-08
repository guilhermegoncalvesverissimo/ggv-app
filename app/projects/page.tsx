import { SectionTitle } from "@/components/SectionCard";
import { FolderKanban } from "lucide-react";


export default function ProjectsPage() {
  return (
    <div className="space-y-4 pt-1">
      <SectionTitle>Projetos</SectionTitle>
      <p className="-mt-2 text-sm text-ink/60">
        O teu portfolio — adiciona projetos com descrição, tags e link.
      </p>

      <div className="card flex flex-col items-center gap-3 p-8 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-soft">
          <FolderKanban className="h-6 w-6 text-accent" strokeWidth={2.25} />
        </div>
        <h2 className="text-lg font-semibold tracking-tight">Portfolio vazio</h2>
        <p className="max-w-xs text-sm text-muted">
          Cria o teu primeiro projeto para o veres listado aqui.
        </p>
        <button className="mt-2 rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-white transition active:scale-95">
          Novo projeto
        </button>
      </div>
    </div>
  );
}
