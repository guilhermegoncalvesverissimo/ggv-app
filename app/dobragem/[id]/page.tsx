import { DubPlayerClient } from "@/components/dobragem/ClientOnly";

export default async function DubPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <DubPlayerClient id={id} />;
}
