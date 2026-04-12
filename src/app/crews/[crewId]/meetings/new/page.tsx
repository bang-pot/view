import { MeetingCreatePageClient } from "@/features/meeting/components/MeetingCreatePageClient";

export default async function CrewMeetingCreatePage({
  params,
}: {
  params: Promise<{ crewId: string }>;
}) {
  const { crewId } = await params;
  return <MeetingCreatePageClient crewId={crewId} />;
}
