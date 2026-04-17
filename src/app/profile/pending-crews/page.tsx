import { ProfileActivityPlaceholderPageClient } from "@/features/auth/components/ProfileActivityPlaceholderPageClient";

export default function PendingCrewsProfilePage() {
  return (
    <ProfileActivityPlaceholderPageClient
      title="가입 대기 중 크루"
      requestedPath="/profile/pending-crews"
    />
  );
}
