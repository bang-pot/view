import { CrewLogFeedPageClient } from "@/features/log/components/CrewLogFeedPageClient";

type CrewLogFeedPageProps = {
  params: Promise<{
    crewId: string;
  }>;
};

export default async function CrewLogFeedPage({ params }: CrewLogFeedPageProps) {
  const { crewId } = await params;

  return <CrewLogFeedPageClient crewId={crewId} />;
}
