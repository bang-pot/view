import { MeetingCreatePageClient } from "@/features/meeting/components/MeetingCreatePageClient";

function getSearchParam(
  value: string | string[] | undefined,
): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

export default async function CrewMeetingCreatePage({
  params,
  searchParams,
}: {
  params: Promise<{ crewId: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { crewId } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : {};

  return (
    <MeetingCreatePageClient
      crewId={crewId}
      initialExploreDefaults={{
        themeName: getSearchParam(resolvedSearchParams.themeName),
        storeName: getSearchParam(resolvedSearchParams.storeName),
        regionLabel: getSearchParam(resolvedSearchParams.regionLabel),
        genre: getSearchParam(resolvedSearchParams.genre),
        difficulty: getSearchParam(resolvedSearchParams.difficulty),
        runningTimeMinutes: getSearchParam(resolvedSearchParams.runningTimeMinutes),
      }}
    />
  );
}
