import { SectionTitle } from "@/components/SectionCard";
import { RestaurantesView } from "@/components/restaurantes/RestaurantesView";

export default function RestaurantesPage() {
  return (
    <div className="space-y-4 pt-1">
      <SectionTitle>Restaurantes</SectionTitle>
      <p className="-mt-2 text-sm text-ink/60">
        Os spots do Gastropiço — toca num ponto para ver a opinião.
      </p>

      <RestaurantesView />
    </div>
  );
}
