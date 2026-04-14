import { MeetingEditPageClient } from "@/features/meeting/components/MeetingEditPageClient";

export default async function CrewMeetingEditPage({
  params,
}: {
  params: Promise<{ crewId: string; meetingId: string }>;
}) {
  const { crewId, meetingId } = await params;
  return <MeetingEditPageClient crewId={crewId} meetingId={meetingId} />;
}
