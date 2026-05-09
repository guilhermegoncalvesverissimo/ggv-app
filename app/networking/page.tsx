import { SectionTitle } from "@/components/SectionCard";
import { NetworkingBoard } from "@/components/networking/NetworkingBoard";

export default function NetworkingPage() {
  return (
    <div className="space-y-4 pt-1">
      <SectionTitle>Networking</SectionTitle>
      <p className="-mt-2 text-sm text-ink/60">
        Cada bolha é uma pessoa. Mantém pressionada para registar mais um
        encontro — quanto mais vezes te vês, maior fica a bolha.
      </p>

      <NetworkingBoard />
    </div>
  );
}
