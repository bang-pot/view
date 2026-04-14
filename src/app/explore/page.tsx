import { ExplorePageClient } from "@/features/explore/components/ExplorePageClient";

type ExplorePageProps = {
  searchParams: Promise<{
    q?: string;
    genres?: string | string[];
    region?: string;
    district?: string;
  }>;
};

function normalizeGenres(value: string | string[] | undefined): string[] {
  if (!value) {
    return [];
  }

  return Array.isArray(value) ? value : [value];
}

export default async function ExplorePage({ searchParams }: ExplorePageProps) {
  const resolvedSearchParams = await searchParams;

  return (
    <ExplorePageClient
      initialQuery={{
        q: resolvedSearchParams.q ?? "",
        genres: normalizeGenres(resolvedSearchParams.genres),
        region: resolvedSearchParams.region ?? "",
        district: resolvedSearchParams.district ?? "",
      }}
    />
  );
}
