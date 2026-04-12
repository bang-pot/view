import { MeetingDetailPageClient } from "@/features/meeting/components/MeetingDetailPageClient";

export default async function CrewMeetingDetailPage({
  params,
}: {
  params: Promise<{ crewId: string; meetingId: string }>;
}) {
  const { crewId, meetingId } = await params;
  return <MeetingDetailPageClient crewId={crewId} meetingId={meetingId} />;
}
