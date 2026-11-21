import { TripDetail } from "@/components/viagens/TripDetail";

export default async function TripPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <TripDetail id={id} />;
}
