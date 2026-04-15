import { MeetingLogDetailPageClient } from "@/features/log/components/MeetingLogDetailPageClient";

export default async function CrewLogDetailPage({
  params,
}: {
  params: Promise<{ crewId: string; logId: string }>;
}) {
  const { crewId, logId } = await params;

  return <MeetingLogDetailPageClient crewId={crewId} logId={logId} />;
}
