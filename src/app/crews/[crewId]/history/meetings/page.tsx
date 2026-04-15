import { CrewMeetingHistoryPageClient } from "@/features/meeting/components/CrewMeetingHistoryPageClient";

type CrewMeetingHistoryPageProps = {
  params: Promise<{
    crewId: string;
  }>;
};

export default async function CrewMeetingHistoryPage({
  params,
}: CrewMeetingHistoryPageProps) {
  const { crewId } = await params;

  return <CrewMeetingHistoryPageClient crewId={crewId} />;
}
