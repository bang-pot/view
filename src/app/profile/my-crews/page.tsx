import { ProfileActivityPlaceholderPageClient } from "@/features/auth/components/ProfileActivityPlaceholderPageClient";

export default function MyCrewsProfilePage() {
  return (
    <ProfileActivityPlaceholderPageClient
      title="소속 크루"
      requestedPath="/profile/my-crews"
    />
  );
}
