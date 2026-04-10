import { CrewJoinRequestsPageClient } from "@/features/crew/components/CrewJoinRequestsPageClient";

export default async function CrewJoinRequestsPage({
  params,
}: {
  params: Promise<{ crewId: string }>;
}) {
  const { crewId } = await params;

  return <CrewJoinRequestsPageClient crewId={crewId} />;
}
