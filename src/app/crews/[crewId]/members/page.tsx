import { CrewMembersPageClient } from "@/features/crew/components/CrewMembersPageClient";

export default async function CrewMembersPage({
  params,
}: {
  params: Promise<{ crewId: string }>;
}) {
  const { crewId } = await params;

  return <CrewMembersPageClient crewId={crewId} />;
}
