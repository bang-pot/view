import { ProfileActivityPlaceholderPageClient } from "@/features/auth/components/ProfileActivityPlaceholderPageClient";

export default function JoinedMeetingsProfilePage() {
  return (
    <ProfileActivityPlaceholderPageClient
      title="참여한 모임"
      requestedPath="/profile/joined-meetings"
    />
  );
}
