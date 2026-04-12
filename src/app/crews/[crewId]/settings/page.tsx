import { CrewSettingsPageClient } from "@/features/crew/components/CrewSettingsPageClient";

export default async function CrewSettingsPage({
  params,
}: {
  params: Promise<{ crewId: string }>;
}) {
  const { crewId } = await params;

  return <CrewSettingsPageClient crewId={crewId} />;
}
