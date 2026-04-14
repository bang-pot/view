import { ExploreThemeDetailPageClient } from "@/features/explore/components/ExploreThemeDetailPageClient";

type ExploreThemeDetailPageProps = {
  params: Promise<{
    themeId: string;
  }>;
};

export default async function ExploreThemeDetailPage({
  params,
}: ExploreThemeDetailPageProps) {
  const resolvedParams = await params;

  return (
    <ExploreThemeDetailPageClient
      key={resolvedParams.themeId}
      themeId={Number(resolvedParams.themeId)}
    />
  );
}
