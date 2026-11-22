import { SectionTitle } from "@/components/SectionCard";
import { DobragemBoardClient } from "@/components/dobragem/ClientOnly";

export default function DobragemPage() {
  return (
    <div className="space-y-4 pt-1">
      <SectionTitle>Vídeos</SectionTitle>
      <p className="-mt-2 text-sm text-ink/60">
        Vídeos em inglês, ouvidos em português. Cola um link do YouTube ou escolhe um vídeo do iPhone.
      </p>
      <DobragemBoardClient />
    </div>
  );
}
