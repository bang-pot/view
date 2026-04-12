import { MeetingListPageClient } from "@/features/meeting/components/MeetingListPageClient";

export default async function CrewMeetingsPage({
  params,
}: {
  params: Promise<{ crewId: string }>;
}) {
  const { crewId } = await params;
  return <MeetingListPageClient crewId={crewId} />;
}
