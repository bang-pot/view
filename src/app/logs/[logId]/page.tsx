import { MeetingLogDetailPageClient } from "@/features/log/components/MeetingLogDetailPageClient";

export default async function MeetingLogDetailPage({
  params,
}: {
  params: Promise<{ logId: string }>;
}) {
  const { logId } = await params;

  return <MeetingLogDetailPageClient logId={logId} />;
}
