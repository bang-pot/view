import { MeetingLogEditorPageClient } from "@/features/log/components/MeetingLogEditorPageClient";

export default async function MeetingLogEditorPage({
  params,
}: {
  params: Promise<{ crewId: string; meetingId: string }>;
}) {
  const { crewId, meetingId } = await params;

  return <MeetingLogEditorPageClient crewId={crewId} meetingId={meetingId} />;
}
