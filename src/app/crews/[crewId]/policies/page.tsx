import { CrewPoliciesPageClient } from "@/features/crew/components/CrewPoliciesPageClient";

export default async function CrewPoliciesPage({
  params,
}: {
  params: Promise<{ crewId: string }>;
}) {
  const { crewId } = await params;

  return <CrewPoliciesPageClient crewId={crewId} />;
}
