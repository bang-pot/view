import { PublicCrewJoinPageClient } from "@/features/crew/components/PublicCrewJoinPageClient";

export default async function PublicCrewDetailPage({
  params,
}: {
  params: Promise<{ crewId: string }>;
}) {
  const { crewId } = await params;

  return <PublicCrewJoinPageClient crewId={Number(crewId)} />;
}
