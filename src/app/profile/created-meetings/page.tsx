import { ProfileActivityPlaceholderPageClient } from "@/features/auth/components/ProfileActivityPlaceholderPageClient";

export default function CreatedMeetingsProfilePage() {
  return (
    <ProfileActivityPlaceholderPageClient
      title="생성한 모임"
      requestedPath="/profile/created-meetings"
    />
  );
}
