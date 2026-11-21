import { SectionTitle } from "@/components/SectionCard";
import { TripsBoard } from "@/components/viagens/TripsBoard";

export default function ViagensPage() {
  return (
    <div className="space-y-4 pt-1">
      <SectionTitle>Viagens</SectionTitle>
      <p className="-mt-2 text-sm text-ink/60">
        Planeia as próximas — roteiro, checklist da mala e orçamento.
      </p>

      <TripsBoard />
    </div>
  );
}
