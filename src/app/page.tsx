import { HomePageClient } from "@/features/auth/components/HomePageClient";

type HomePageProps = {
  searchParams: Promise<{
    notice?: string;
  }>;
};

export default async function Home({ searchParams }: HomePageProps) {
  const { notice } = await searchParams;

  return <HomePageClient notice={notice ?? null} />;
}
