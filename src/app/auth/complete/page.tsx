import { Suspense } from "react";

import { AuthCompletePageClient } from "@/features/auth/components/AuthCompletePageClient";

export default function AuthCompletePage() {
  return (
    <Suspense fallback={<main><p>보완 상태를 확인하고 있습니다.</p></main>}>
      <AuthCompletePageClient />
    </Suspense>
  );
}
