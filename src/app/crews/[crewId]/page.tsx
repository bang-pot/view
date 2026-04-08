import { CrewPageClient } from "@/features/crew/components/CrewPageClient";

export default async function CrewPage({
  params,
}: {
  params: Promise<{ crewId: string }>;
}) {
  const { crewId } = await params;

  return <CrewPageClient crewId={crewId} />;
}
