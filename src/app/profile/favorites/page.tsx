import { ProfileActivityPlaceholderPageClient } from "@/features/auth/components/ProfileActivityPlaceholderPageClient";

export default function ProfileFavoritesPage() {
  return (
    <ProfileActivityPlaceholderPageClient
      title="찜한 테마"
      requestedPath="/profile/favorites"
    />
  );
}
