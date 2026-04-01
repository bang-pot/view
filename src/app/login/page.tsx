import { Suspense } from "react";

import { LoginPageClient } from "@/features/auth/components/LoginPageClient";

export default function LoginPage() {
  return (
    <Suspense fallback={<main><p>로그인 상태를 확인하고 있습니다.</p></main>}>
      <LoginPageClient />
    </Suspense>
  );
}
