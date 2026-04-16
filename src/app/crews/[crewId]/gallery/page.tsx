import { CrewGalleryPageClient } from "@/features/gallery/components/CrewGalleryPageClient";

type CrewGalleryPageProps = {
  params: Promise<{
    crewId: string;
  }>;
};

export default async function CrewGalleryPage({ params }: CrewGalleryPageProps) {
  const { crewId } = await params;

  return <CrewGalleryPageClient crewId={crewId} />;
}
