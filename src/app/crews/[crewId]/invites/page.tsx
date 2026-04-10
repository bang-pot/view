import { CrewInvitesPageClient } from "@/features/crew/components/CrewInvitesPageClient";

export default async function CrewInvitesPage({
  params,
}: {
  params: Promise<{ crewId: string }>;
}) {
  const { crewId } = await params;

  return <CrewInvitesPageClient crewId={crewId} />;
}
