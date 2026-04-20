import { CrewSchedulePageClient } from "@/features/crew/components/CrewSchedulePageClient";

export default async function CrewSchedulePage({
  params,
}: {
  params: Promise<{ crewId: string }>;
}) {
  const { crewId } = await params;
  return <CrewSchedulePageClient crewId={crewId} />;
}
